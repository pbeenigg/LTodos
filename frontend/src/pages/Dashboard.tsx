import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth-store';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await api.post('/tasks', { title: newTaskTitle });
      setNewTaskTitle('');
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
        await api.delete(`/tasks/${id}`);
        fetchTasks();
    } catch (error) {
        console.error('Failed to delete task', error);
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="font-bold text-xl text-blue-600">{t('dashboard.title')}</div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{t('dashboard.welcome', { name: user?.name })}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-gray-900 hover:text-gray-600"
              >
                {t('dashboard.logout')}
              </button>
              <div className="border-l pl-4 border-gray-300">
                 <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleCreateTask} className="flex gap-4">
            <input
              type="text"
              className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder={t('dashboard.taskPlaceholder')}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t('dashboard.addTask')}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-500">{t('dashboard.status')}: {task.status} | {t('dashboard.priority')}: {task.priority}</p>
              </div>
              <div className="flex gap-2">
                 <button className="text-blue-600 hover:text-blue-800 text-sm">{t('dashboard.edit')}</button>
                 <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:text-red-800 text-sm">{t('dashboard.delete')}</button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-10">{t('dashboard.noTasks')}</div>
          )}
        </div>
      </main>
    </div>
  );
}

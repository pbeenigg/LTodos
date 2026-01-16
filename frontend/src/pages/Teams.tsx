import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { useAuthStore } from '../store/auth-store';
import LanguageSwitcher from '../components/LanguageSwitcher';
import i18n from '@/lib/i18n';

interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch teams', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      await api.post('/teams', { name: newTeamName });
      setNewTeamName('');
      setIsModalOpen(false);
      fetchTeams();
    } catch (error) {
      console.error('Failed to create team', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              <div className="font-bold text-xl text-blue-600 cursor-pointer" onClick={() => navigate('/')}>
                {t('dashboard.title')}
              </div>
              <div className="flex gap-4">
                 <Link to="/" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                 </Link>
                 <Link to="/teams" className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    {t('teams.myTeams')}
                 </Link>
              </div>
            </div>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('teams.myTeams')}</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            {t('teams.createTeam')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              to={`/teams/${team.id}`}
              key={team.id}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
              <p className="mt-2 text-sm text-gray-500">
                {t('teams.created', { date: new Date(team.createdAt).toLocaleDateString(i18n.language) })}
              </p>
            </Link>
          ))}
          {teams.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">
              {t('teams.noTeams')}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">{t('teams.createTeam')}</h2>
            <form onSubmit={handleCreateTeam}>
              <input
                type="text"
                className="w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 mb-4"
                placeholder={t('teams.teamName')}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-sm font-semibold text-gray-900 hover:text-gray-500"
                >
                  {t('teams.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {t('teams.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

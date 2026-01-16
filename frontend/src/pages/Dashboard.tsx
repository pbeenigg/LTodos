import React, { useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import NotificationsPopover from "../components/NotificationsPopover";
import {
  Filter,
  X,
  Repeat,
  Plus,
  LogOut,
  LayoutDashboard,
  Users,
  Edit2,
  Trash2,
  ChevronRight,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  recurrenceRule?: string;
  parentId?: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    sortOrder: "DESC",
    onlyFollowed: false,
    creatorId: "",
    assigneeId: "",
    creatorName: "",
    assigneeName: "",
  });

  const [activeTab, setActiveTab] = useState<
    "ALL" | "CREATED" | "ASSIGNED" | "FOLLOWED"
  >("ALL");

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchTasks = useCallback(async () => {
    try {
      // Build query string
      const params = new URLSearchParams();
      // ... filters
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.onlyFollowed) params.append("onlyFollowed", "true");
      if (filters.creatorId) params.append("creatorId", filters.creatorId);
      if (filters.assigneeId) params.append("assigneeId", filters.assigneeId);
      if (filters.creatorName)
        params.append("creatorName", filters.creatorName);
      if (filters.assigneeName)
        params.append("assigneeName", filters.assigneeName);

      const response = await api.get(`/tasks?${params.toString()}`);

      let allTasks = response.data;

      // If displaying "ALL" or "CREATED", hide subtasks (tasks with parentId)
      // to avoid clutter and show hierarchy logic correctly (subtasks belong to parent)
      if (activeTab === "ALL" || activeTab === "CREATED") {
        allTasks = allTasks.filter((t: Task) => !t.parentId);
      }

      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await api.post("/tasks", { title: newTaskTitle });
      setNewTaskTitle("");
      fetchTasks();
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
  };

  const handleUpdateTask = async (id: string) => {
    if (!editingTaskTitle.trim()) return;
    try {
      await api.patch(`/tasks/${id}`, { title: editingTaskTitle });
      setEditingTaskId(null);
      setEditingTaskTitle("");
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      startDate: "",
      endDate: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
      onlyFollowed: false,
      creatorId: "",
      assigneeId: "",
      creatorName: "",
      assigneeName: "",
    });
    setActiveTab("ALL");
  };

  const handleTabChange = (
    tab: "ALL" | "CREATED" | "ASSIGNED" | "FOLLOWED"
  ) => {
    setActiveTab(tab);
    const newFilters = { ...filters };

    // Reset view-specific filters
    newFilters.creatorId = "";
    newFilters.assigneeId = "";
    newFilters.onlyFollowed = false;

    switch (tab) {
      case "CREATED":
        if (user) newFilters.creatorId = user.id;
        break;
      case "ASSIGNED":
        if (user) newFilters.assigneeId = user.id;
        break;
      case "FOLLOWED":
        newFilters.onlyFollowed = true;
        break;
      case "ALL":
      default:
        break;
    }
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              <div className="font-bold text-xl text-blue-600">
                {t("dashboard.title")}
              </div>
              <div className="flex gap-4">
                <span className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-default flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </span>
                <Link
                  to="/teams"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {t("teams.myTeams")}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {t("dashboard.welcome", { name: user?.name })}
              </span>
              <NotificationsPopover />
              <button
                type="button"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                title={t("dashboard.logout")}
              >
                <LogOut className="w-5 h-5" />
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
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === "ALL"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("ALL")}
            >
              {t("dashboard.all")}
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === "CREATED"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("CREATED")}
            >
              {t("dashboard.created")}
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === "ASSIGNED"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("ASSIGNED")}
            >
              {t("dashboard.assigned")}
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === "FOLLOWED"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("FOLLOWED")}
            >
              {t("dashboard.following")}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateTask(e);
            }}
            className="flex gap-4"
          >
            <input
              type="text"
              className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder={t("dashboard.taskPlaceholder")}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("dashboard.addTask")}
            </button>
          </form>
        </div>

        {/* Filters Toggle */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4" />
            {t("dashboard.filter")}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label
                htmlFor="filter-status"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t("dashboard.status")}
              </label>
              <select
                id="filter-status"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">{t("dashboard.all")}</option>
                <option value="TODO">{t("dashboard.todo")}</option>
                <option value="IN_PROGRESS">{t("dashboard.inProgress")}</option>
                <option value="DONE">{t("dashboard.done")}</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-priority"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t("dashboard.priority")}
              </label>
              <select
                id="filter-priority"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
              >
                <option value="">{t("dashboard.all")}</option>
                <option value="LOW">{t("dashboard.low")}</option>
                <option value="MEDIUM">{t("dashboard.medium")}</option>
                <option value="HIGH">{t("dashboard.high")}</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-startDate"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t("dashboard.startDate")}
              </label>
              <input
                id="filter-startDate"
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="filter-endDate"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t("dashboard.endDate")}
              </label>
              <input
                id="filter-endDate"
                type="date"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="filter-sortBy"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Sort By
              </label>
              <select
                id="filter-sortBy"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  setFilters({ ...filters, sortBy, sortOrder });
                }}
              >
                <option value="createdAt-DESC">
                  {t("dashboard.sort.newestCreated")}
                </option>
                <option value="createdAt-ASC">
                  {t("dashboard.sort.oldestCreated")}
                </option>
                <option value="dueDate-ASC">
                  {t("dashboard.sort.dueDateEarliest")}
                </option>
                <option value="dueDate-DESC">
                  {t("dashboard.sort.dueDateLatest")}
                </option>
                <option value="priority-DESC">
                  {t("dashboard.sort.priorityHighLow")}
                </option>
                <option value="priority-ASC">
                  {t("dashboard.sort.priorityLowHigh")}
                </option>
                <option value="creator-ASC">
                  {t("dashboard.sort.creatorAZ")}
                </option>
                <option value="creator-DESC">
                  {t("dashboard.sort.creatorZA")}
                </option>
                <option value="id-ASC">{t("dashboard.sort.idAsc")}</option>
                <option value="id-DESC">{t("dashboard.sort.idDesc")}</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-creatorName"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t("dashboard.filterCreators")}
              </label>
              <input
                id="filter-creatorName"
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={filters.creatorName}
                onChange={(e) =>
                  setFilters({ ...filters, creatorName: e.target.value })
                }
                placeholder={t("dashboard.searchCreator")}
              />
            </div>
            <div>
              <label
                htmlFor="filter-assigneeName"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t("dashboard.filterAssignees")}
              </label>
              <input
                id="filter-assigneeName"
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={filters.assigneeName}
                onChange={(e) =>
                  setFilters({ ...filters, assigneeName: e.target.value })
                }
                placeholder={t("dashboard.searchAssignee")}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                {t("dashboard.clearFilters")}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                if (editingTaskId !== task.id) {
                  navigate(`/tasks/${task.id}`);
                }
              }}
              className={`group bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 relative overflow-hidden ${
                editingTaskId === task.id
                  ? "p-4"
                  : "hover:shadow-md hover:border-blue-400 cursor-pointer"
              }`}
            >
              {/* Priority Strip */}
              {editingTaskId !== task.id && (
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    task.priority === "HIGH"
                      ? "bg-red-500"
                      : task.priority === "MEDIUM"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                />
              )}

              {editingTaskId === task.id ? (
                <div
                  className="flex-1 flex gap-2 items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    className="flex-1 rounded-md border-0 py-1 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    value={editingTaskTitle}
                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateTask(task.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      {t("dashboard.save")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      {t("dashboard.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center p-4 pl-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </span>
                      {task.recurrenceRule && (
                        <span
                          title="Recurring Task"
                          className="bg-blue-50 p-1 rounded"
                        >
                          <Repeat className="w-3.5 h-3.5 text-blue-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          task.status === "DONE"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {task.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        {t("dashboard.priority")}:{" "}
                        <span
                          className={`font-medium ${
                            task.priority === "HIGH"
                              ? "text-red-600"
                              : task.priority === "MEDIUM"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div
                      className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleStartEdit(task)}
                        className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                        title={t("dashboard.edit")}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title={t("dashboard.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              {t("dashboard.noTasks")}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

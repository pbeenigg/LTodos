import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Bell, BellOff } from "lucide-react";
import NotificationsPopover from "../components/NotificationsPopover";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface History {
  id: string;
  changeType: string;
  oldValue: string;
  newValue: string;
  changedBy: User;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  dueDate: string;
  reminderTime: string;
  recurrenceRule: string;
  assignee?: User;
  creator: User;
  team?: {
    id: string;
    name: string;
    members?: { userId: string; user: User }[];
  };
  subtasks: Task[];
  comments: Comment[];
  history: History[];
  followers?: User[];
}

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    dueDate: "",
    reminderTime: "",
    recurrenceRule: "",
    assigneeId: "",
  });

  // For Subtasks
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  // For Comments
  const [newComment, setNewComment] = useState("");
  // For Assignee Search
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${id}`);
      const taskData = response.data;
      setTask(taskData);
      setEditForm({
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate ? taskData.dueDate.split("T")[0] : "",
        reminderTime: taskData.reminderTime
          ? new Date(taskData.reminderTime).toISOString().slice(0, 16)
          : "", // datetime-local format
        recurrenceRule: taskData.recurrenceRule || "",
        assigneeId: taskData.assignee?.id || "",
      });

      // Pre-load team members if available
      if (taskData.team) {
        const teamRes = await api.get(`/teams/${taskData.team.id}`);
        const members = teamRes.data.members.map((m: any) => m.user);
        setUserSearchResults(members);
      }

      // Check follow status
      if (user && taskData.followers) {
        setIsFollowing(taskData.followers.some((f: User) => f.id === user.id));
      }
    } catch (error) {
      console.error("Failed to fetch task", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      // Clean up payload: convert empty strings to null/undefined
      const payload: any = {
        ...editForm,
        reminderTime: editForm.reminderTime
          ? new Date(editForm.reminderTime).toISOString()
          : null,
        dueDate: editForm.dueDate
          ? new Date(editForm.dueDate).toISOString()
          : null,
        assigneeId: editForm.assigneeId || null,
        description: editForm.description || null,
        recurrenceRule: editForm.recurrenceRule || null,
      };

      // Remove nulls if you want, but backend DTO IsOptional handles null/undefined usually?
      // NestJS validation pipe with transform=true usually strips undefined, but null might pass if IsOptional allows it.
      // Actually IsOptional checks (obj.prop !== undefined && obj.prop !== null).
      // So sending null is fine.

      await api.patch(`/tasks/${id}`, payload);
      setIsEditing(false);
      fetchTask();
    } catch (error) {
      console.error("Failed to update task", error);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      await api.post("/tasks", {
        title: newSubtaskTitle,
        parentId: id,
      });
      setNewSubtaskTitle("");
      fetchTask();
    } catch (error) {
      console.error("Failed to add subtask", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post("/comments", {
        taskId: id,
        content: newComment,
      });
      setNewComment("");
      fetchTask();
    } catch (error) {
      console.error("Failed to add comment", error);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setAssigneeSearch(query);
    if (!query.trim()) return;

    if (!task?.team) {
      try {
        const res = await api.get(`/users/search?email=${query}`);
        setUserSearchResults(res.data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const selectAssignee = (user: User) => {
    setEditForm({ ...editForm, assigneeId: user.id });
    setAssigneeSearch(user.email);
    setShowAssigneeSearch(false);
  };

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/tasks/${id}/followers`);
      } else {
        await api.post(`/tasks/${id}/followers`, {});
      }
      fetchTask();
    } catch (error) {
      console.error("Failed to toggle follow", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUpdateSubtaskStatus = async (
    subtaskId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    try {
      await api.patch(`/tasks/${subtaskId}`, { status: newStatus });
      fetchTask();
    } catch (error) {
      console.error("Failed to update subtask status", error);
    }
  };

  const getRecurrenceLabel = (rule: string) => {
    switch (rule) {
      case "FREQ=DAILY":
        return t("dashboard.daily");
      case "FREQ=WEEKLY":
        return t("dashboard.weekly");
      case "FREQ=MONTHLY":
        return t("dashboard.monthly");
      case "FREQ=YEARLY":
        return t("dashboard.yearly");
      default:
        return rule;
    }
  };

  if (loading)
    return <div className="p-10 text-center">{t("dashboard.loading")}</div>;
  if (!task)
    return (
      <div className="p-10 text-center">{t("dashboard.taskNotFound")}</div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              <div
                className="font-bold text-xl text-blue-600 cursor-pointer"
                onClick={() => navigate("/")}
              >
                {t("dashboard.title")}
              </div>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/teams"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
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
                onClick={handleLogout}
                className="text-sm font-semibold text-gray-900 hover:text-gray-600"
              >
                {t("dashboard.logout")}
              </button>
              <div className="border-l pl-4 border-gray-300">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            &larr; {t("dashboard.back")}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Task Main Info */}
            <div className="bg-white rounded-lg shadow overflow-hidden p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    className="w-full text-2xl font-bold border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                  <textarea
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={5}
                    placeholder={t("dashboard.description")}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("dashboard.status")}
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                      >
                        <option value="TODO">{t("dashboard.todo")}</option>
                        <option value="IN_PROGRESS">
                          {t("dashboard.inProgress")}
                        </option>
                        <option value="DONE">{t("dashboard.done")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("dashboard.priority")}
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={editForm.priority}
                        onChange={(e) =>
                          setEditForm({ ...editForm, priority: e.target.value })
                        }
                      >
                        <option value="LOW">{t("dashboard.low")}</option>
                        <option value="MEDIUM">{t("dashboard.medium")}</option>
                        <option value="HIGH">{t("dashboard.high")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("dashboard.dueDate")}
                      </label>
                      <input
                        type="date"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={editForm.dueDate}
                        onChange={(e) =>
                          setEditForm({ ...editForm, dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("dashboard.reminder") || "Reminder"}
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={editForm.reminderTime}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            reminderTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("dashboard.recurrence") || "Repeat"}
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={editForm.recurrenceRule}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            recurrenceRule: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          {t("dashboard.none") || "None"}
                        </option>
                        <option value="FREQ=DAILY">
                          {t("dashboard.daily") || "Daily"}
                        </option>
                        <option value="FREQ=WEEKLY">
                          {t("dashboard.weekly") || "Weekly"}
                        </option>
                        <option value="FREQ=MONTHLY">
                          {t("dashboard.monthly") || "Monthly"}
                        </option>
                        <option value="FREQ=YEARLY">
                          {t("dashboard.yearly")}
                        </option>
                      </select>
                    </div>
                    <div className="relative col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("dashboard.assignee")}
                      </label>
                      <input
                        type="text"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder={t("dashboard.searchUserPlaceholder")}
                        value={assigneeSearch}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        onFocus={() => setShowAssigneeSearch(true)}
                      />
                      {showAssigneeSearch && userSearchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                          {userSearchResults.map((u) => (
                            <li
                              key={u.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => selectAssignee(u)}
                            >
                              {u.name} ({u.email})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                      {t("dashboard.cancel")}
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {t("dashboard.save")}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {task.title}
                    </h1>
                    <div className="flex gap-2">
                      <button
                        onClick={handleToggleFollow}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 border ${
                          isFollowing
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <Bell className="w-4 h-4 fill-current" />
                            {t("dashboard.unfollow")}
                          </>
                        ) : (
                          <>
                            <BellOff className="w-4 h-4" />
                            {t("dashboard.follow")}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setAssigneeSearch(task.assignee?.email || "");
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {t("dashboard.edit")}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === "DONE"
                          ? "bg-green-100 text-green-800"
                          : task.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "MEDIUM"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {task.priority}
                    </span>
                    {task.team && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {t("dashboard.teamPrefix")}
                        {task.team.name}
                      </span>
                    )}
                  </div>

                  <div className="prose max-w-none text-gray-700 mb-8">
                    <p className="whitespace-pre-wrap">
                      {task.description || (
                        <span className="text-gray-400 italic">
                          {t("dashboard.noDescription")}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-sm text-gray-500 border-t pt-4">
                    <div>
                      <span className="block font-medium text-gray-700 mb-1">
                        {t("dashboard.assignee")}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 rounded-full h-8 w-8 flex items-center justify-center text-gray-600 font-bold">
                          {task.assignee
                            ? task.assignee.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <span>
                          {task.assignee
                            ? task.assignee.name
                            : t("dashboard.unassigned")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="block font-medium text-gray-700 mb-1">
                        {t("dashboard.dueDate")}
                      </span>
                      <span>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                    {task.reminderTime && (
                      <div>
                        <span className="block font-medium text-gray-700 mb-1">
                          {t("dashboard.reminder")}
                        </span>
                        <span>
                          {new Date(task.reminderTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {task.recurrenceRule && (
                      <div>
                        <span className="block font-medium text-gray-700 mb-1">
                          {t("dashboard.recurrence") || "Repeat"}
                        </span>
                        <span>{getRecurrenceLabel(task.recurrenceRule)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t("dashboard.subtasks")}
              </h2>
              <form onSubmit={handleAddSubtask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder={t("dashboard.addSubtask")}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  {t("dashboard.add")}
                </button>
              </form>
              <ul className="space-y-2">
                {task.subtasks.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={sub.status === "DONE"}
                        onChange={() =>
                          handleUpdateSubtaskStatus(sub.id, sub.status)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <Link
                        to={`/tasks/${sub.id}`}
                        className={`font-medium ${
                          sub.status === "DONE"
                            ? "text-gray-400 line-through"
                            : "text-blue-600 hover:underline"
                        }`}
                      >
                        {sub.title}
                      </Link>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        sub.status === "DONE"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </li>
                ))}
                {task.subtasks.length === 0 && (
                  <li className="text-gray-500 text-sm italic text-center py-2">
                    No subtasks
                  </li>
                )}
              </ul>
            </div>

            {/* Comments (Removed) */}
            {/* 
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t("dashboard.comments")}
              </h2>
              <div className="space-y-4 mb-6">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="bg-blue-100 rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {task.comments.length === 0 && (
                  <div className="text-gray-500 text-sm italic text-center py-2">
                    No comments yet
                  </div>
                )}
              </div>
              <form onSubmit={handleAddComment}>
                <textarea
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
                  rows={2}
                  placeholder={t("dashboard.addComment")}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
            */}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Activity Stream (Comments & History) */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {t("dashboard.activity")}
                </h2>
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
                  rows={2}
                  placeholder={t("dashboard.addComment")}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    {t("dashboard.post")}
                  </button>
                </div>
              </form>

              {/* Stream */}
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {[...task.comments, ...task.history]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((item: any) => {
                    const isComment = "content" in item;
                    return (
                      <div
                        key={item.id}
                        className="relative pl-8 pb-4 border-l border-gray-200 last:border-0 last:pb-0"
                      >
                        <div
                          className={`absolute -left-4 top-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                            isComment
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isComment ? "💬" : "📝"}
                        </div>
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {isComment
                                ? item.user.name
                                : item.changedBy?.name || t("dashboard.system")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {isComment ? (
                            <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg mt-1">
                              {item.content}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 mt-1">
                              {item.changeType === "ASSIGNEE_CHANGED" ? (
                                <span>{t("dashboard.changedAssignee")}</span>
                              ) : (
                                <span>
                                  {t("dashboard.changed", {
                                    field: item.changeType?.toLowerCase(),
                                  })}
                                </span>
                              )}

                              {item.changeType !== "ASSIGNEE_CHANGED" && (
                                <div className="mt-1 flex items-center gap-2 text-xs">
                                  <span className="line-through text-red-400 bg-red-50 px-1 rounded">
                                    {item.oldValue}
                                  </span>
                                  <span>&rarr;</span>
                                  <span className="text-green-600 bg-green-50 px-1 rounded">
                                    {item.newValue}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {task.comments.length === 0 && task.history.length === 0 && (
                  <div className="text-gray-500 text-sm italic text-center">
                    {t("dashboard.noActivity")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

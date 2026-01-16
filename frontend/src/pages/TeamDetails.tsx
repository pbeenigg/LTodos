import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import LanguageSwitcher from "../components/LanguageSwitcher";

interface User {
  id: string;
  email: string;
  name: string;
}

interface Member {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: User;
}

interface Team {
  id: string;
  name: string;
  createdAt: string;
  members: Member[];
}

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const response = await api.get(`/teams/${id}`);
      setTeam(response.data);
    } catch (error) {
      console.error("Failed to fetch team", error);
      navigate("/teams");
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    try {
      const response = await api.get(`/users/search?email=${searchEmail}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Failed to search user", error);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await api.post(`/teams/${id}/members`, { userId, role: "MEMBER" });
      setSearchEmail("");
      setSearchResults([]);
      setIsModalOpen(false);
      fetchTeam();
    } catch (error) {
      console.error("Failed to add member", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/teams/${id}/members/${userId}`);
      fetchTeam();
    } catch (error) {
      console.error("Failed to remove member", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!team) return <div>Loading...</div>;

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
                  className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t("teams.myTeams")}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {t("dashboard.welcome", { name: user?.name })}
              </span>
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link to="/teams" className="text-gray-500 hover:text-gray-700">
              &larr; {t("teams.back")}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            {t("teams.addMember")}
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="px-4 py-4 sm:px-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center text-blue-600 font-bold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.user.name}
                    </p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {t(`teams.${member.role.toLowerCase()}`)}
                  </span>
                  {member.role !== "OWNER" && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      {t("teams.remove")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">{t("teams.addMember")}</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder={t("teams.searchUser")}
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleSearchUser}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {t("teams.search")}
              </button>
            </div>

            {searchResults.length > 0 && (
              <ul className="mb-4 border rounded-md divide-y">
                {searchResults.map((u) => (
                  <li
                    key={u.id}
                    className="p-3 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(u.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {t("teams.add")}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-2 text-sm font-semibold text-gray-900 hover:text-gray-500"
              >
                {t("teams.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

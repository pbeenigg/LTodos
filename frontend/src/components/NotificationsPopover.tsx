import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { useAuthStore } from "../store/auth-store";

interface Notification {
  id: string;
  content: string;
  isRead: boolean;
  taskId: string;
  createdAt: string;
}

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!user) return;

    // WebSocket Connection
    const socket = io("http://localhost:3000", {
      query: { userId: user.id },
    });

    socket.on("connect", () => {
      console.log("Connected to WS");
    });

    socket.on("notification", (payload: Notification) => {
      toast(payload.content, {
        icon: "🔔",
        duration: 5000,
      });
      setNotifications((prev) => [payload, ...prev]);
      setHasUnread(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      setHasUnread(res.data.some((n: Notification) => !n.isRead));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setHasUnread(notifications.some((n) => n.id !== id && !n.isRead));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setHasUnread(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) handleMarkAsRead(n.id);
    setIsOpen(false);
    if (n.taskId) {
      navigate(`/tasks/${n.taskId}`);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Toaster position="top-right" />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full text-gray-500 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">
              {t("notifications.title")}
            </h3>
            {hasUnread && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    n.isRead ? "opacity-60" : "bg-blue-50"
                  }`}
                  onClick={() => handleNotificationClick(n)}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") handleNotificationClick(n);
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <p className="text-sm text-gray-800">{n.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString(i18n.language)}
                  </p>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500 text-sm">
                {t("notifications.empty")}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

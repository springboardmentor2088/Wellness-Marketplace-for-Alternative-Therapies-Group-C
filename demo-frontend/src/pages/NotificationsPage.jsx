import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { logout } from "../services/authService";
import { getMyNotifications, markNotificationAsRead } from "../services/notificationService";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((n) => String(n?.status || "").toUpperCase() === "UNREAD").length,
    [notifications]
  );

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
      );
    } catch (err) {
      // No-op to keep UI responsive.
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-emerald-800 text-white p-6 space-y-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">WellnessHub</h2>
        <nav className="space-y-1 text-sm">
          <p onClick={() => navigate("/patient-dashboard")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Dashboard</p>
          <p onClick={() => navigate("/practitioners")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Browse Practitioners</p>
          <p onClick={() => navigate("/my-sessions")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">My Sessions</p>
          <p onClick={() => navigate("/products")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Wellness Products</p>
          <p onClick={() => navigate("/community")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Community Q&A</p>
          <p onClick={() => navigate("/my-orders")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">My Orders</p>
          <p onClick={() => navigate("/wishlist")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Wishlist</p>
          <p className="px-3 py-2 bg-emerald-700 rounded-lg font-semibold cursor-pointer">Notifications ({unreadCount})</p>
        </nav>

        <button onClick={handleLogout} className="mt-auto bg-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition font-semibold text-sm w-full">
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">All Notifications</h1>
            <p className="text-gray-500 mt-1">Track your session and order updates in one place.</p>
          </div>
          <button onClick={loadNotifications} className="text-sm font-bold text-emerald-700 hover:underline">Refresh</button>
        </div>

        {loading && <p className="text-gray-500">Loading notifications...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
            No notifications yet.
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((n) => {
              const unread = String(n?.status || "").toUpperCase() === "UNREAD";
              return (
                <div key={n.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${unread ? "border-emerald-200" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.createdAt ? format(new Date(n.createdAt), "MMM d, yyyy hh:mm a") : ""}</p>
                      <p className="text-[11px] mt-1 text-emerald-700">Type: {n.type}</p>
                    </div>
                    {unread ? (
                      <button onClick={() => handleMarkRead(n.id)} className="text-xs font-bold text-emerald-700 hover:underline">
                        Mark as read
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 font-semibold">Read</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;

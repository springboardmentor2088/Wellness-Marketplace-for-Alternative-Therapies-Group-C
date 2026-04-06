import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { getUserDashboard } from "../services/practitionerService";
import CalendarWidget from "../components/CalendarWidget";
import { format, isSameDay } from "date-fns";
import { generateGoogleCalendarUrl } from "../utils/calendarUtils";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getUserDashboard();
        setUserData(response.data);
      } catch (err) {
        setError("Failed to load dashboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const name = userData?.userProfile?.name || "User";
  const sessionHistory = userData?.sessionHistory || [];
  const notifications = userData?.notifications || [];
  const unreadNotifications = notifications.filter(n => String(n?.status || "").toUpperCase() === "UNREAD");
  const upcomingSessions = sessionHistory.filter(s => s.status === "booked" && new Date(s.date) > new Date());
  const upcomingCount = upcomingSessions.length;
  const productOrders = userData?.productOrders?.length || 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Sessions falling on the calendar selected date
  const sessionsOnDate = sessionHistory.filter(s =>
    isSameDay(new Date(s.date), calendarDate)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-800 text-white p-6 space-y-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">WellnessHub</h2>
        <nav className="space-y-1 text-sm">
          <p className="px-3 py-2 bg-emerald-700 rounded-lg font-semibold cursor-pointer">Dashboard</p>
          <p onClick={() => navigate("/practitioners")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Browse Practitioners</p>
          <p onClick={() => navigate("/my-sessions")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">My Sessions</p>
          <p onClick={() => navigate("/products")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Wellness Products</p>
          <p onClick={() => navigate("/community")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Community Q&A</p>
          <p onClick={() => navigate("/my-orders")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">My Orders</p>
          <p onClick={() => navigate("/wishlist")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Wishlist</p>
          <p onClick={() => navigate("/notifications")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition flex items-center justify-between">
            Notifications
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{unreadNotifications.length}</span>
          </p>
          <p className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition opacity-50">Profile</p>
        </nav>

        <button onClick={handleLogout} className="mt-auto bg-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition font-semibold text-sm w-full">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Hello, {name} 👋</h1>
          <p className="text-gray-500 mt-1">Here's an overview of your wellness journey.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Upcoming Sessions</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{upcomingCount}</p>
            <p className="text-xs text-gray-400 mt-1">{upcomingCount === 0 ? "No sessions booked yet" : `${upcomingCount} upcoming`}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{sessionHistory.length}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Orders</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{productOrders}</p>
            <p className="text-xs text-gray-400 mt-1">{productOrders === 0 ? "No purchases yet" : `${productOrders} orders`}</p>
          </div>
        </div>

        {/* Calendar + Session Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Session Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">My Session Calendar</h2>
            <p className="text-xs text-gray-500 mb-4">Click a date to see scheduled sessions</p>
            <CalendarWidget onDateSelect={setCalendarDate} selectedDate={calendarDate} />
            {sessionsOnDate.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  {format(calendarDate, "MMM d")} — {sessionsOnDate.length} session{sessionsOnDate.length !== 1 ? "s" : ""}
                </p>
                {sessionsOnDate.map(s => (
                  <div key={s.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-900">Dr. {s.practitioner?.name}</p>
                    <p className="text-xs text-emerald-600">{format(new Date(s.date), "hh:mm a")}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigate(`/sessions/${s.id}`)} className="text-emerald-700 text-xs font-bold hover:underline">
                        View
                      </button>
                      {s.status === "booked" && (
                        <a href={generateGoogleCalendarUrl(s)} target="_blank" rel="noopener noreferrer"
                          className="text-indigo-600 text-xs font-bold hover:underline">
                          + Calendar
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-400 text-center">No sessions on {format(calendarDate, "MMMM d")}</p>
            )}
          </div>

          {/* Upcoming Sessions + Reminders */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">Upcoming Sessions & Reminders</h2>
              <button onClick={() => navigate("/my-sessions")} className="text-xs text-emerald-600 font-bold hover:underline">View all</button>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {upcomingSessions.slice(0, 5).map(session => {
                  const sessionDate = new Date(session.date);
                  const msUntil = sessionDate - new Date();
                  const hoursUntil = msUntil / (1000 * 60 * 60);
                  const isSoon = hoursUntil > 0 && hoursUntil <= 24;
                  const isVeryClose = hoursUntil > 0 && hoursUntil <= 1;

                  return (
                    <div key={session.id} className={`px-6 py-4 hover:bg-gray-50 transition ${isSoon ? "border-l-4 border-amber-400" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isSoon ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {session.practitioner?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">Dr. {session.practitioner?.name}</p>
                            <p className="text-xs text-gray-500">{format(new Date(session.date), "MMM d, yyyy · hh:mm a")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isVeryClose && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">NOW</span>
                          )}
                          {isSoon && !isVeryClose && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">SOON</span>
                          )}
                          <button onClick={() => navigate(`/sessions/${session.id}`)} className="text-emerald-600 text-xs font-bold hover:underline">Details</button>
                        </div>
                      </div>
                      {session.notes && (
                        <p className="mt-2 text-xs text-gray-500 italic ml-13">&ldquo;{session.notes}&rdquo;</p>
                      )}
                      {isSoon && (
                        <div className="mt-2 flex items-center gap-3 ml-1">
                          <p className="text-xs text-amber-700 font-medium">
                            {isVeryClose ? "Starting in less than 1 hour!" : `Starting in ${Math.round(hoursUntil)} hours`}
                          </p>
                          <a href={generateGoogleCalendarUrl(session)} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-600 font-bold hover:underline">+ Add to Calendar</a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 text-sm">No upcoming sessions.</p>
                <button onClick={() => navigate("/practitioners")} className="mt-3 text-emerald-600 text-sm font-bold hover:underline">
                  Book your first session →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions + Notifications */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-base font-bold text-gray-800 mb-1">Find a Practitioner</h2>
            <p className="text-sm text-gray-500 mb-5">Browse verified therapists and book a session.</p>
            <button onClick={() => navigate("/practitioners")}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">
              Browse Practitioners
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const hiddenPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const MedicalChatbotIcon = () => (
  <svg
    viewBox="0 0 64 64"
    className="h-10 w-10"
    role="img"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="orbGradient" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="panelGradient" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dcfce7" />
      </linearGradient>
    </defs>

    <circle cx="32" cy="32" r="30" fill="url(#orbGradient)" />
    <rect x="15" y="14" width="34" height="24" rx="11" fill="url(#panelGradient)" />
    <rect x="20" y="39" width="24" height="12" rx="6" fill="#065f46" opacity="0.95" />
    <circle cx="26" cy="26" r="2.6" fill="#065f46" />
    <circle cx="38" cy="26" r="2.6" fill="#065f46" />
    <path d="M24 31c2.2 2.3 5 3.4 8 3.4s5.8-1.1 8-3.4" fill="none" stroke="#065f46" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M47 45h6" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 42v6" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const ChatbotLauncher = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  if (!token || role !== "PATIENT") {
    return null;
  }

  if (hiddenPaths.has(location.pathname) || location.pathname === "/chatbot") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/chatbot")}
      className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_14px_30px_rgba(5,150,105,0.35)] ring-2 ring-white flex items-center justify-center hover:scale-105 hover:shadow-[0_18px_34px_rgba(5,150,105,0.45)] transition-all"
      aria-label="Open chatbot"
      title="Open AI Chatbot"
    >
      <MedicalChatbotIcon />
    </button>
  );
};

export default ChatbotLauncher;

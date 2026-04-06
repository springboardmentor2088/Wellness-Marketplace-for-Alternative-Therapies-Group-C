import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const startChat = async () => {
  const response = await api.post("/chat/start");
  return response.data;
};

export const answerChat = async (sessionId, answer) => {
  const response = await api.post("/chat/answer", {
    sessionId,
    answer,
  });
  return response.data;
};

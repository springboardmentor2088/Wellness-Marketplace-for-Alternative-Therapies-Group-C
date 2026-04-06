import axios from "axios";
import { clearCurrentUserIdCache } from "./userService";

const API_BASE_URL = "http://localhost:8080/api/auth";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(`${API_BASE_URL}/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  const response = await api.post("/login", { email, password });
  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post("/register/user", data);
  return response.data;
};

export const registerPractitioner = async (data) => {
  const response = await api.post("/register/practitioner", data);
  return response.data;
};

export const fetchPractitionerByLicense = async (licenseNumber) => {
  const response = await api.get(`/license/${encodeURIComponent(licenseNumber)}`);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post("/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post("/reset-password", { token, newPassword });
  return response.data;
};

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");
  const response = await api.post("/refresh", { refreshToken });
  return response.data;
};

export const saveAuthData = (response) => {
  localStorage.setItem("accessToken", response.accessToken);
  localStorage.setItem("refreshToken", response.refreshToken);
  localStorage.setItem("role", response.role);
  if (response.name) {
    localStorage.setItem("name", response.name);
  } else {
    localStorage.removeItem("name");
  }
};

export const logout = () => {
  clearCurrentUserIdCache();
  localStorage.clear();
};

import { getUserDashboard } from "./practitionerService";

let cachedUserId = null;
let cachedToken = null;

export const clearCurrentUserIdCache = () => {
  cachedUserId = null;
  cachedToken = null;
  localStorage.removeItem("userId");
};

export const getCurrentUserId = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    clearCurrentUserIdCache();
    throw new Error("Not authenticated");
  }

  if (cachedToken !== token) {
    // Token changed (new login/refresh/account switch) so user id must be re-resolved.
    cachedUserId = null;
    cachedToken = token;
    localStorage.removeItem("userId");
  }

  if (cachedUserId) return cachedUserId;

  const stored = localStorage.getItem("userId");
  if (stored) {
    const parsed = Number(stored);
    if (Number.isFinite(parsed) && parsed > 0) {
      cachedUserId = parsed;
      return cachedUserId;
    }
  }

  const response = await getUserDashboard();
  const id = response?.data?.userProfile?.id;
  if (!id) {
    throw new Error("Unable to resolve current user id");
  }

  cachedUserId = id;
  cachedToken = token;
  localStorage.setItem("userId", String(id));
  return cachedUserId;
};

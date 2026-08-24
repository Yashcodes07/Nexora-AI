const TOKEN_KEY = "nexora.auth";

function getStorage() {
  if (localStorage.getItem(TOKEN_KEY)) return localStorage;
  if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage;
  return null;
}

export function getTokens() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    return JSON.parse(storage.getItem(TOKEN_KEY));
  } catch {
    clearTokens();
    return null;
  }
}

export function saveTokens(tokens, remember = true) {
  clearTokens();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
  const data = await response.json().catch(() => null);
  if (response.ok) return data;

  const detail = data?.detail;
  const message = Array.isArray(detail)
    ? detail.map((item) => item.msg).join(". ")
    : detail || "Something went wrong. Please try again.";
  throw new Error(message);
}

export async function registerUser(input) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse(response);
}

export async function loginUser(credentials) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return parseResponse(response);
}

export async function requestPasswordReset(email) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseResponse(response);
}

export async function resetPassword(token, password) {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return parseResponse(response);
}

async function refreshAccessToken(tokens) {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  return parseResponse(response);
}

export async function authenticatedRequest(path, options = {}) {
  let tokens = getTokens();
  if (!tokens) throw new Error("You need to log in first.");

  const request = (accessToken) =>
    fetch(path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await request(tokens.access_token);
  if (response.status === 401) {
    const remember = getStorage() === localStorage;
    try {
      tokens = await refreshAccessToken(tokens);
      saveTokens(tokens, remember);
      response = await request(tokens.access_token);
    } catch (error) {
      clearTokens();
      throw error;
    }
  }

  return parseResponse(response);
}

export function getDashboardSection(section = "") {
  const suffix = section ? `/${section}` : "";
  return authenticatedRequest(`/api/dashboard${suffix}`);
}

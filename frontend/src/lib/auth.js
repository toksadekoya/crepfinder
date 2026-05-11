import api, { apiBaseUrl } from './api.js';

const OAUTH_CONNECTION_KEY = 'crepfinder_oauth_connection';

export function getInitials(user) {
  const name = user?.display_name || user?.username || user?.email || 'Guest user';
  const parts = name
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function getStoredOAuthConnection() {
  try {
    const raw = localStorage.getItem(OAUTH_CONNECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistOAuthConnection(connection) {
  localStorage.setItem(OAUTH_CONNECTION_KEY, JSON.stringify(connection));
}

export function clearOAuthConnection() {
  localStorage.removeItem(OAUTH_CONNECTION_KEY);
}

export function beginOAuth(provider) {
  window.location.href = `${apiBaseUrl}/api/auth/${provider}`;
}

export function beginGoogleOAuth() {
  beginOAuth('google');
}

export function beginLinkedInOAuth() {
  beginOAuth('linkedin');
}

export async function fetchAuthStatus() {
  const { data } = await api.get('/api/auth/status');
  return data;
}

export async function logout() {
  await api.post('/api/auth/logout');
  clearOAuthConnection();
}

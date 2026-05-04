import api, { apiBaseUrl } from './api.js';

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
}

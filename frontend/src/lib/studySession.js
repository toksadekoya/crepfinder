const STORAGE_KEY = 'crepfinder_study_session';

function padCode(value) {
  return `P${String(value).padStart(3, '0')}`;
}

export function getStoredStudySession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistStudySession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function createFallbackStudySession() {
  const code = padCode(Math.floor(Math.random() * 999) + 1);
  const condition = Math.random() < 0.5 ? 'A' : 'B';

  return {
    participantCode: code,
    condition,
    consentedAt: new Date().toISOString(),
    offlineFallback: true,
  };
}

export function clearStudySession() {
  localStorage.removeItem(STORAGE_KEY);
}

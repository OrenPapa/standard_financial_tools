async function requestAuth(path, options = {}) {
  const response = await fetch(`/api/auth${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || 'Authentication failed.');
    error.code = body.code || 'auth_failed';
    throw error;
  }

  return body;
}

export async function getCurrentUser() {
  try {
    const body = await requestAuth('/me');
    return body.user || null;
  } catch (error) {
    if (error.code === 'token_expired') {
      const refreshed = await refreshSession().catch(() => null);
      return refreshed?.user || null;
    }

    return null;
  }
}

export function registerUser({ username, email, password }) {
  return requestAuth('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
}

export function loginUser({ email, password }) {
  return requestAuth('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function logoutUser() {
  return requestAuth('/logout', {
    method: 'POST'
  });
}

export function refreshSession() {
  return requestAuth('/refresh', {
    method: 'POST'
  });
}

export function startSessionRefresh(intervalMs = 12 * 60 * 1000) {
  const timer = window.setInterval(() => {
    refreshSession().catch(() => {
      window.clearInterval(timer);
    });
  }, intervalMs);

  return () => window.clearInterval(timer);
}

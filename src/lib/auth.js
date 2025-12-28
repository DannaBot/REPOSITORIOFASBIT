// Client-side auth helper that talks to the local server
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function login(email, password) {
  const res = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }
  const { token, user } = await res.json();
  try {
    localStorage.setItem('fasbit_user', JSON.stringify({ ...user, token }));
  } catch (e) {
    console.error('localStorage error', e);
  }
  return user;
}

export function logout() {
  try {
    localStorage.removeItem('fasbit_user');
  } catch (e) {
    console.error('localStorage error', e);
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('fasbit_user')) || null;
  } catch (e) {
    return null;
  }
}

export function getToken() {
  const u = getUser();
  return u && u.token ? u.token : null;
}

export function isRole(role) {
  const u = getUser();
  return !!u && u.role === role;
}

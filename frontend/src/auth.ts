// frontend/src/auth.ts
import { reactive } from 'vue';
import axios from 'axios';

export type UserRole = 'admin' | 'allread' | 'onlyedit' | 'onlyread';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  assignedGroupIds: string[];
}

export const authState = reactive<{
  token: string | null;
  user: AuthUser | null;
}>({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
});

// 初始化 axios interceptor
axios.interceptors.request.use((config) => {
  if (authState.token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${authState.token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      logout();
    }
    return Promise.reject(err);
  },
);

export async function login(username: string, password: string): Promise<void> {
  const { data } = await axios.post('/api/auth/login', { username, password });
  authState.token = data.access_token;
  authState.user = data.user;
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function logout() {
  authState.token = null;
  authState.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isLoggedIn(): boolean {
  return !!authState.token;
}

export function canEdit(groupId?: string | null): boolean {
  if (!authState.user) return false;
  const r = authState.user.role;
  if (r === 'admin') return true;
  if (r === 'onlyedit') {
    if (!groupId) return false;
    return authState.user.assignedGroupIds.includes(groupId);
  }
  return false;
}

export function canRead(groupId?: string | null): boolean {
  if (!authState.user) return false;
  const r = authState.user.role;
  if (r === 'admin' || r === 'allread') return true;
  if (r === 'onlyedit' || r === 'onlyread') {
    if (!groupId) return false;
    return authState.user.assignedGroupIds.includes(groupId);
  }
  return false;
}

export function isAdmin(): boolean {
  return authState.user?.role === 'admin';
}

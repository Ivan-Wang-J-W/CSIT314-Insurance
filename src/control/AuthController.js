import { api, tokenStore } from '../utils/api.js';
import { backendToUser } from '../utils/mappers.js';

export const AuthController = {
  async login(username, password) {
    const data = await api.post('/auth/login', { username, password });
    tokenStore.set(data.token);
    return backendToUser(data.user);
  },

  async register(data) {
    await api.post('/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      role: data.role,
      phone: data.phone,
    });
    return this.login(data.username, data.password);
  },

  async currentUser() {
    try {
      if (!tokenStore.get()) return null;
      const data = await api.get('/auth/me');
      return backendToUser(data.user);
    } catch {
      tokenStore.remove();
      return null;
    }
  },

  async logout() {
    tokenStore.remove();
  },
};

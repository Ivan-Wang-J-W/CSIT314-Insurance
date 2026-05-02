import { createContext, useContext, useEffect, useState } from 'react';
import { AuthController } from '../control/AuthController.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthController.currentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const logged = await AuthController.login(username, password);
    setUser(logged);
    return logged;
  };

  const register = async (data) => {
    const registered = await AuthController.register(data);
    setUser(registered);
    return registered;
  };

  const logout = async () => {
    await AuthController.logout();
    setUser(null);
  };

  const refresh = () => {
    AuthController.currentUser().then(setUser).catch(() => {});
  };

  const value = { user, loading, login, register, logout, refresh };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

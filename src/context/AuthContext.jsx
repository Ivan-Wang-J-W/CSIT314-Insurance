/**
 * AuthContext — shares the current user across the app and exposes
 * login/logout/register via the AuthController.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthController } from '../control/AuthController.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage session on mount.
  useEffect(() => {
    setUser(AuthController.currentUser());
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: (u, p) => {
        const logged = AuthController.login(u, p);
        setUser(logged);
        return logged;
      },
      register: (data) => {
        const registered = AuthController.register(data);
        setUser(registered);
        return registered;
      },
      logout: () => {
        AuthController.logout();
        setUser(null);
      },
      refresh: () => setUser(AuthController.currentUser()),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

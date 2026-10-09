import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { verifyAdminLoginInDb, changeAdminPasswordInDb } from '../services/neonDb';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'pulari_admin_session_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const login = useCallback(async (username, password, remember = false) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await verifyAdminLoginInDb(username, password);
      if (result.success) {
        setUser(result.user);
        const dataToSave = JSON.stringify(result.user);
        if (remember) {
          localStorage.setItem(AUTH_STORAGE_KEY, dataToSave);
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, dataToSave);
        }
        return { success: true };
      } else {
        setAuthError(result.error || 'Invalid credentials');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const msg = err.message || 'Authentication error';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const res = await changeAdminPasswordInDb(user.username, currentPassword, newPassword);
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authError,
    setAuthError,
    login,
    logout,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

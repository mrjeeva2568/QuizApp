import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { onSessionExpired } from '../services/apiClient';
import { tokenStorage } from '../utils/tokenStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  // Starts true whenever a token exists, so ProtectedRoute doesn't briefly
  // redirect to /login before the background /me check has had a chance to run.
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.getAccessToken()));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // On mount, if a token is already stored, validate it (and refresh the
  // cached user) by calling /me in the background. An invalid/expired token
  // that can't be refreshed logs the user out cleanly rather than leaving
  // stale localStorage state around.
  useEffect(() => {
    const existingToken = tokenStorage.getAccessToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    userService
      .getCurrentUser()
      .then((freshUser) => {
        if (cancelled) return;
        tokenStorage.setSession({ user: freshUser });
        setUser(freshUser);
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // apiClient calls this when a token refresh fails outright (e.g. refresh
  // token itself expired) - keeps the "log the user out" logic in one place.
  useEffect(() => onSessionExpired(logout), [logout]);

  const login = useCallback(async (credentials) => {
    const authResponse = await authService.login(credentials);
    tokenStorage.setSession(authResponse);
    setUser(authResponse.user);
    return authResponse.user;
  }, []);

  const register = useCallback(async (payload) => {
    const authResponse = await authService.register(payload);
    tokenStorage.setSession(authResponse);
    setUser(authResponse.user);
    return authResponse.user;
  }, []);

  const hasRole = useCallback(
    (role) => Boolean(user?.roles?.includes(role)),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      hasRole,
    }),
    [user, isLoading, login, register, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { onSessionExpired } from '../services/apiClient';
import { tokenStorage } from '../utils/tokenStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Never render a persisted profile as authenticated before the matching
  // token has been validated by /me.
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const authOperation = useRef(0);

  const logout = useCallback(() => {
    authOperation.current += 1;
    tokenStorage.clear();
    setUser(null);
    setIsLoading(false);
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

    const operation = authOperation.current;
    let cancelled = false;
    userService
      .getCurrentUser()
      .then((freshUser) => {
        if (cancelled || operation !== authOperation.current) return;
        tokenStorage.setSession({ user: freshUser });
        setUser(freshUser);
      })
      .catch(() => {
        if (cancelled || operation !== authOperation.current) return;
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled && operation === authOperation.current) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // apiClient calls this when a token refresh fails outright (e.g. refresh
  // token itself expired) - keeps the "log the user out" logic in one place.
  useEffect(() => onSessionExpired(logout), [logout]);

  const login = useCallback(async (credentials) => {
    const operation = ++authOperation.current;
    setUser(null);
    setIsLoading(true);
    tokenStorage.clear();

    try {
      const authResponse = await authService.login(credentials);
      if (operation !== authOperation.current) return null;

      tokenStorage.setSession({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      });
      const freshUser = await userService.getCurrentUser();
      if (operation !== authOperation.current) return null;

      tokenStorage.setSession({ user: freshUser });
      setUser(freshUser);
      return freshUser;
    } catch (error) {
      if (operation === authOperation.current) {
        tokenStorage.clear();
        setUser(null);
      }
      throw error;
    } finally {
      if (operation === authOperation.current) setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    const operation = ++authOperation.current;
    setUser(null);
    setIsLoading(true);
    tokenStorage.clear();
    try {
      const authResponse = await authService.register(payload);
      if (operation !== authOperation.current) return null;
      tokenStorage.setSession(authResponse);
      setUser(authResponse.user);
      return authResponse.user;
    } catch (error) {
      if (operation === authOperation.current) {
        tokenStorage.clear();
        setUser(null);
      }
      throw error;
    } finally {
      if (operation === authOperation.current) setIsLoading(false);
    }
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

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loginUser,
  logoutUser,
  registerUser,
  subscribeAuthState,
} from '../services/authService';
import { isFirebaseConfigured } from '../services/firebaseConfig';
import { startPresenceTracking } from '../services/presenceService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(currentUser => {
      setUser(currentUser);
      setInitializing(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const stopPresence = startPresenceTracking(user.uid);
    return () => {
      if (typeof stopPresence === 'function') {
        stopPresence();
      }
    };
  }, [user?.uid]);

  const login = useCallback(async ({ email, password }) => {
    setAuthActionLoading(true);
    try {
      const loggedInUser = await loginUser({ email, password });
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setAuthActionLoading(false);
    }
  }, []);

  const register = useCallback(async ({ fullName, email, password }) => {
    setAuthActionLoading(true);
    try {
      const createdUser = await registerUser({ fullName, email, password });
      setUser(createdUser);
      return createdUser;
    } finally {
      setAuthActionLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthActionLoading(true);
    try {
      await logoutUser(user?.uid);
      setUser(null);
    } finally {
      setAuthActionLoading(false);
    }
  }, [user?.uid]);

  const value = useMemo(
    () => ({
      user,
      initializing,
      authActionLoading,
      isConfigured: isFirebaseConfigured(),
      login,
      register,
      logout,
    }),
    [user, initializing, authActionLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider.');
  }
  return context;
};

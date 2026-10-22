import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe } from "../api/auth";
import { setAuthToken, setUnauthorizedHandler } from "../api/client";
import { useToast } from "../components/Toast";
import type { User } from "../types";

const TOKEN_KEY = "miniledger.token"; // the ONLY thing persisted on the device

interface AuthState {
  user: User | null;
  loading: boolean; // true while restoring the session at startup
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }, []);

  // Restore the session on startup: load the token, then confirm it with the server.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          setAuthToken(stored);
          setUser(await fetchMe());
        }
      } catch {
        await signOut(); // expired / invalid token (or server unreachable) -> back to login
      } finally {
        setLoading(false);
      }
    })();
  }, [signOut]);

  // If any protected request later returns 401, drop the session and tell the user.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut().then(() => toast("Your session expired. Please log in again.", "error"));
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut, toast]);

  const signIn = useCallback(async (token: string, nextUser: User) => {
    setAuthToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(nextUser);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

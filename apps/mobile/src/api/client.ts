import axios, { AxiosError } from "axios";
import Constants from "expo-constants";
import type { ApiErrorBody } from "../types";

const API_PORT = 4000;

/** API base URL: EXPO_PUBLIC_API_URL if set, otherwise the same LAN host that serves the Expo dev bundle. */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.23:8081"
  if (hostUri) return `http://${hostUri.split(":")[0]}:${API_PORT}`;
  throw new Error("API URL not configured. Set EXPO_PUBLIC_API_URL in apps/mobile/.env (see README).");
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (t: string | null) => {
  token = t;
};
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export const api = axios.create({ timeout: 15000 });

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid token on a protected call logs the user out gracefully.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && token && !error.config?.url?.includes("/auth/")) onUnauthorized?.();
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.data?.error?.message) return error.response.data.error.message;
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (!error.response) return "Can't reach the server. Check your internet and the API URL.";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

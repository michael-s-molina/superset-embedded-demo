import axios from 'axios';
import type { GuestTokenRequest, ServerConfig } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Cached server config
let cachedServerConfig: ServerConfig | null = null;

/**
 * Fetch the server configuration.
 * This tells the client how the server is configured (JWT auth, pre-configured domains, etc.)
 */
export const fetchServerConfig = async (): Promise<ServerConfig> => {
  if (cachedServerConfig) {
    return cachedServerConfig;
  }

  const response = await apiClient.get<ServerConfig>('/config');
  cachedServerConfig = response.data;
  return cachedServerConfig;
};

/**
 * Get cached server config (returns null if not yet fetched)
 */
export const getCachedServerConfig = (): ServerConfig | null => {
  return cachedServerConfig;
};

export const fetchGuestToken = async (request: GuestTokenRequest): Promise<string> => {
  // Build request body based on what's provided
  // The server will determine whether to use JWT signing or Superset API
  const requestBody: Record<string, unknown> = {
    dashboardId: request.dashboardId,
    rls: request.rls,
  };

  // Only include credentials if provided (not needed when JWT auth is enabled)
  if (request.supersetApiDomain) {
    requestBody.supersetDomain = request.supersetApiDomain;
  }
  if (request.supersetUsername) {
    requestBody.supersetUsername = request.supersetUsername;
  }
  if (request.supersetPassword) {
    requestBody.supersetPassword = request.supersetPassword;
  }

  const response = await apiClient.post<{ token: string }>('/guest-token', requestBody);
  return response.data.token;
};

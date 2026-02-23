import axios from 'axios';
import type { GuestTokenRequest, AppConfig } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

/**
 * Server configuration, injected at build time from the same environment
 * variables that the server reads (SUPERSET_FRONTEND_DOMAIN, SUPERSET_API_DOMAIN,
 * PERMALINK_DOMAIN, GUEST_TOKEN_SECRET / GUEST_TOKEN_SECRET_FILE).
 */
export const appConfig: AppConfig = __CONFIG__;

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

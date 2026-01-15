import axios from 'axios';
import type { GuestTokenRequest } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const fetchGuestToken = async (request: GuestTokenRequest): Promise<string> => {
  // Transform the request to use supersetDomain for the backend
  const response = await apiClient.post<{ token: string }>('/guest-token', {
    supersetDomain: request.supersetApiDomain,
    supersetUsername: request.supersetUsername,
    supersetPassword: request.supersetPassword,
    dashboardId: request.dashboardId,
    rls: request.rls,
  });
  return response.data.token;
};

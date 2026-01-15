import axios from 'axios';

interface GuestTokenPayload {
  supersetDomain: string;
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
  };
  rls: Array<{ clause: string }>;
}

async function getAccessToken(
  domain: string,
  username: string,
  password: string
): Promise<string> {
  const loginResponse = await axios.post(`${domain}/api/v1/security/login`, {
    username,
    password,
    provider: 'db',
    refresh: true
  });

  return loginResponse.data.access_token;
}

export async function fetchSupersetGuestToken(payload: GuestTokenPayload): Promise<string> {
  const {
    supersetDomain,
    supersetUsername,
    supersetPassword,
    dashboardId,
    user,
    rls
  } = payload;

  // Get access token by authenticating with Superset
  const accessToken = await getAccessToken(supersetDomain, supersetUsername, supersetPassword);

  // Request guest token
  const guestTokenResponse = await axios.post(
    `${supersetDomain}/api/v1/security/guest_token/`,
    {
      user,
      resources: [
        {
          type: 'dashboard',
          id: dashboardId
        }
      ],
      rls
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return guestTokenResponse.data.token;
}

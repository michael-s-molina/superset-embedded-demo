import { Router } from 'express';
import { fetchSupersetGuestToken } from '../services/supersetClient.js';
import { generateGuestToken, isJwtSigningEnabled, JWT_USERNAME_HEADER } from '../services/jwtTokenService.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// Request body when using Superset API (JWT signing disabled)
interface SupersetApiRequestBody {
  supersetDomain: string;
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  rls: Array<{ clause: string }>;
}

// Request body when using JWT signing (JWT signing enabled)
interface JwtSigningRequestBody {
  dashboardId: string;
  rls: Array<{ clause: string }>;
}

type GuestTokenRequestBody = SupersetApiRequestBody | JwtSigningRequestBody;

const validateRequiredField = (value: unknown, fieldName: string, res: Response): boolean => {
  if (!value) {
    res.status(400).json({ error: `${fieldName} is required` });
    return false;
  }
  return true;
};

router.post('/guest-token', async (
  req: Request<object, object, GuestTokenRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dashboardId, rls } = req.body;

    if (!validateRequiredField(dashboardId, 'dashboardId', res)) {
      return;
    }

    // Check if JWT signing is enabled
    if (isJwtSigningEnabled() && JWT_USERNAME_HEADER) {
      // Get username from the configured header (set by reverse proxy after authentication)
      const username = req.headers[JWT_USERNAME_HEADER];
      if (!username || typeof username !== 'string') {
        res.status(401).json({
          error: 'Not authenticated',
          message: `Missing or invalid ${JWT_USERNAME_HEADER} header`
        });
        return;
      }

      // Generate token locally using JWT signing
      const token = generateGuestToken({
        username,
        dashboardId,
        rls: rls || [],
      });

      res.json({ token });
    } else {
      // Use Superset API to fetch token
      const body = req.body as SupersetApiRequestBody;
      const { supersetDomain, supersetUsername, supersetPassword } = body;

      const requiredFields = [
        { value: supersetDomain, name: 'supersetDomain' },
        { value: supersetUsername, name: 'supersetUsername' },
        { value: supersetPassword, name: 'supersetPassword' },
      ];

      for (const field of requiredFields) {
        if (!validateRequiredField(field.value, field.name, res)) {
          return;
        }
      }

      const token = await fetchSupersetGuestToken({
        supersetDomain,
        supersetUsername,
        supersetPassword,
        dashboardId,
        user: {
          username: 'guest',
          first_name: 'Guest',
          last_name: 'User'
        },
        rls: rls || []
      });

      res.json({ token });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

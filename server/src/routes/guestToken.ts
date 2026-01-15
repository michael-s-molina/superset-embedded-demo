import { Router } from 'express';
import { fetchSupersetGuestToken } from '../services/supersetClient.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

interface GuestTokenRequestBody {
  supersetDomain: string;
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  rls: Array<{ clause: string }>;
}

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
    const { supersetDomain, supersetUsername, supersetPassword, dashboardId, rls } = req.body;

    const requiredFields = [
      { value: supersetDomain, name: 'supersetDomain' },
      { value: supersetUsername, name: 'supersetUsername' },
      { value: supersetPassword, name: 'supersetPassword' },
      { value: dashboardId, name: 'dashboardId' },
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
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router } from 'express';
import { isJwtSigningEnabled } from '../services/jwtTokenService.js';
import type { Request, Response } from 'express';

const router = Router();

// Environment variables for host configuration
const SUPERSET_FRONTEND_DOMAIN = process.env.SUPERSET_FRONTEND_DOMAIN;
const SUPERSET_API_DOMAIN = process.env.SUPERSET_API_DOMAIN;
const PERMALINK_DOMAIN = process.env.PERMALINK_DOMAIN;

export interface ServerConfig {
  // Whether JWT signing is enabled (hides credentials UI)
  jwtAuthEnabled: boolean;
  // Pre-configured domains (when set, hides respective UI inputs)
  supersetFrontendDomain?: string;
  supersetApiDomain?: string;
  permalinkDomain?: string;
}

/**
 * GET /api/config
 * Returns the server configuration to the client.
 * This allows the client to adapt its UI based on how the server is configured.
 */
router.get('/config', (_req: Request, res: Response) => {
  const config: ServerConfig = {
    jwtAuthEnabled: isJwtSigningEnabled(),
    supersetFrontendDomain: SUPERSET_FRONTEND_DOMAIN,
    supersetApiDomain: SUPERSET_API_DOMAIN,
    permalinkDomain: PERMALINK_DOMAIN,
  };

  res.json(config);
});

export default router;

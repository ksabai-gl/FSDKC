import { timingSafeEqual } from 'crypto';

const AUTH_ENABLED = process.env.REQUIRE_API_TOKEN === 'true';
const DEV_API_TOKEN = process.env.DEV_API_TOKEN || '';

function tokensMatch(expected, provided) {
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(provided));
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Bearer token auth for dev-api parity with Laravel Sanctum (MBA-49 / AC-D01).
 * Skipped when REQUIRE_API_TOKEN is not true or DEV_API_TOKEN is unset.
 */
export function requireDevApiAuth(req, res, next) {
  if (!AUTH_ENABLED || !DEV_API_TOKEN) {
    return next();
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token || !tokensMatch(DEV_API_TOKEN, token)) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }

  return next();
}

export function assertProductionAuthConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if ((AUTH_ENABLED || nodeEnv === 'production') && !DEV_API_TOKEN) {
    console.error('FATAL: DEV_API_TOKEN must be set when REQUIRE_API_TOKEN=true or NODE_ENV=production');
    process.exit(1);
  }
}

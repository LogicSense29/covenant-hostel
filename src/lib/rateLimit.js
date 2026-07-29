/**
 * In-memory rate limiter for Next.js App Router API routes.
 * No external dependencies required — uses a Map with automatic cleanup.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 });
 *   const { allowed, retryAfterSeconds } = limiter.check(ip);
 */

const store = new Map();

// Cleanup expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1_000);
}

/**
 * @param {object} options
 * @param {number} options.maxAttempts  - Max requests allowed in the window
 * @param {number} options.windowMs     - Window duration in milliseconds
 * @param {string} [options.keyPrefix]  - Optional prefix to namespace keys
 */
export function createRateLimiter({ maxAttempts, windowMs, keyPrefix = "rl" }) {
  return {
    /**
     * @param {string} identifier - Usually the client IP or email address
     * @returns {{ allowed: boolean, retryAfterSeconds?: number }}
     */
    check(identifier) {
      const key = `${keyPrefix}:${identifier}`;
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        // First request in this window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
      }

      if (entry.count >= maxAttempts) {
        const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1_000);
        return { allowed: false, retryAfterSeconds };
      }

      entry.count += 1;
      return { allowed: true };
    },
  };
}

/**
 * Extracts the real client IP from a Next.js App Router request.
 * Handles reverse proxies (Vercel, Nginx, etc.).
 *
 * @param {Request} req
 * @returns {string}
 */
export function getClientIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

import {
  RateLimiter,
  isBlockedRoute,
  isAdminRoute,
  isAdminAllowedRoute,
  BLOCKED_ROUTES,
} from '../helpers/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('should allow first request', () => {
    expect(limiter.isRateLimited('ip:1', 5, 60_000)).toBe(false);
  });

  it('should allow requests up to the limit', () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      expect(limiter.isRateLimited('ip:1', 5, 60_000, now)).toBe(false);
    }
  });

  it('should block requests exceeding the limit', () => {
    const now = Date.now();
    // First 5 requests are OK
    for (let i = 0; i < 5; i++) {
      limiter.isRateLimited('ip:1', 5, 60_000, now);
    }
    // 6th request should be blocked
    expect(limiter.isRateLimited('ip:1', 5, 60_000, now)).toBe(true);
  });

  it('should reset after window expires', () => {
    const now = Date.now();
    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      limiter.isRateLimited('ip:1', 5, 60_000, now);
    }
    expect(limiter.isRateLimited('ip:1', 5, 60_000, now)).toBe(true);

    // After window expires, should allow again
    const afterWindow = now + 60_001;
    expect(limiter.isRateLimited('ip:1', 5, 60_000, afterWindow)).toBe(false);
  });

  it('should track different keys independently', () => {
    const now = Date.now();
    // Fill up ip:1
    for (let i = 0; i < 5; i++) {
      limiter.isRateLimited('ip:1', 5, 60_000, now);
    }
    expect(limiter.isRateLimited('ip:1', 5, 60_000, now)).toBe(true);

    // ip:2 should still be allowed
    expect(limiter.isRateLimited('ip:2', 5, 60_000, now)).toBe(false);
  });

  it('should handle different limits per route', () => {
    const now = Date.now();
    // Contact: 5 req / 5 min
    for (let i = 0; i < 5; i++) {
      limiter.isRateLimited('/api/contact:ip1', 5, 300_000, now);
    }
    expect(limiter.isRateLimited('/api/contact:ip1', 5, 300_000, now)).toBe(true);

    // Admin: 30 req / 1 min - should still have room
    for (let i = 0; i < 30; i++) {
      expect(limiter.isRateLimited('/api/admin:ip1', 30, 60_000, now)).toBe(false);
    }
    expect(limiter.isRateLimited('/api/admin:ip1', 30, 60_000, now)).toBe(true);
  });

  it('should store correct entry data', () => {
    const now = 1000000;
    limiter.isRateLimited('test', 5, 60_000, now);
    const entry = limiter.getEntry('test');
    expect(entry).toBeDefined();
    expect(entry!.count).toBe(1);
    expect(entry!.resetAt).toBe(now + 60_000);
  });

  it('should clear all entries', () => {
    limiter.isRateLimited('key1', 5, 60_000);
    limiter.isRateLimited('key2', 5, 60_000);
    limiter.clear();
    expect(limiter.getEntry('key1')).toBeUndefined();
    expect(limiter.getEntry('key2')).toBeUndefined();
  });
});

describe('isBlockedRoute', () => {
  it('should block /debug route', () => {
    expect(isBlockedRoute('/debug')).toBe(true);
  });

  it('should block /api/debug route', () => {
    expect(isBlockedRoute('/api/debug')).toBe(true);
    expect(isBlockedRoute('/api/debug/env')).toBe(true);
  });

  it('should block /api/test- routes', () => {
    expect(isBlockedRoute('/api/test-email')).toBe(true);
    expect(isBlockedRoute('/api/test-stripe')).toBe(true);
  });

  it('should block /api/dev/ routes', () => {
    expect(isBlockedRoute('/api/dev/verify-educators')).toBe(true);
    expect(isBlockedRoute('/api/dev/confirm-email')).toBe(true);
  });

  it('should block /api/run-siret-migration', () => {
    expect(isBlockedRoute('/api/run-siret-migration')).toBe(true);
  });

  it('should block /api/send-certification-emails', () => {
    expect(isBlockedRoute('/api/send-certification-emails')).toBe(true);
  });

  it('should NOT block normal API routes', () => {
    expect(isBlockedRoute('/api/contact')).toBe(false);
    expect(isBlockedRoute('/api/appointments/propose')).toBe(false);
    expect(isBlockedRoute('/api/auth/reset-password')).toBe(false);
  });

  it('should NOT block public pages', () => {
    expect(isBlockedRoute('/')).toBe(false);
    expect(isBlockedRoute('/recherche')).toBe(false);
    expect(isBlockedRoute('/a-propos')).toBe(false);
  });

  it('should have correct number of blocked routes', () => {
    expect(BLOCKED_ROUTES.length).toBe(6);
  });
});

describe('isAdminRoute', () => {
  it('should identify /admin as admin route', () => {
    expect(isAdminRoute('/admin')).toBe(true);
    expect(isAdminRoute('/admin/users')).toBe(true);
    expect(isAdminRoute('/admin/verifications')).toBe(true);
  });

  it('should identify /api/admin as admin route', () => {
    expect(isAdminRoute('/api/admin')).toBe(true);
    expect(isAdminRoute('/api/admin/stats')).toBe(true);
  });

  it('should NOT identify non-admin routes', () => {
    expect(isAdminRoute('/dashboard/educator')).toBe(false);
    expect(isAdminRoute('/api/contact')).toBe(false);
    expect(isAdminRoute('/')).toBe(false);
  });
});

describe('isAdminAllowedRoute', () => {
  it('should allow /admin routes for admins', () => {
    expect(isAdminAllowedRoute('/admin')).toBe(true);
    expect(isAdminAllowedRoute('/admin/users')).toBe(true);
  });

  it('should allow /auth/login for admins', () => {
    expect(isAdminAllowedRoute('/auth/login')).toBe(true);
  });

  it('should allow /api routes for admins', () => {
    expect(isAdminAllowedRoute('/api/admin/stats')).toBe(true);
  });

  it('should NOT allow dashboard routes for admins', () => {
    expect(isAdminAllowedRoute('/dashboard/educator')).toBe(false);
    expect(isAdminAllowedRoute('/dashboard/family')).toBe(false);
  });

  it('should NOT allow public pages for admins', () => {
    expect(isAdminAllowedRoute('/recherche')).toBe(false);
    expect(isAdminAllowedRoute('/a-propos')).toBe(false);
  });
});

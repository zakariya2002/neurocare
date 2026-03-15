import { checkAdminAccess, checkAuthAccess, Session } from '../helpers/admin-logic';

describe('checkAdminAccess', () => {
  it('should return 401 when session is null', () => {
    const result = checkAdminAccess(null);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it('should return 403 when user role is not admin', () => {
    const session: Session = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        user_metadata: { role: 'family' },
      },
    };
    const result = checkAdminAccess(session);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
  });

  it('should return 403 when user_metadata has no role', () => {
    const session: Session = {
      user: {
        id: 'user-2',
        email: 'user@example.com',
        user_metadata: {},
      },
    };
    const result = checkAdminAccess(session);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
  });

  it('should authorize when user role is admin', () => {
    const session: Session = {
      user: {
        id: 'admin-1',
        email: 'admin@neuro-care.fr',
        user_metadata: { role: 'admin' },
      },
    };
    const result = checkAdminAccess(session);
    expect(result.authorized).toBe(true);
    expect(result.user).toEqual({ id: 'admin-1', email: 'admin@neuro-care.fr' });
    expect(result.status).toBeUndefined();
  });

  it('should return 403 for educator role', () => {
    const session: Session = {
      user: {
        id: 'edu-1',
        email: 'educator@example.com',
        user_metadata: { role: 'educator' },
      },
    };
    const result = checkAdminAccess(session);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(403);
  });
});

describe('checkAuthAccess', () => {
  it('should return 401 when session is null', () => {
    const result = checkAuthAccess(null);
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  it('should authenticate any valid user and return their role', () => {
    const session: Session = {
      user: {
        id: 'user-1',
        email: 'family@example.com',
        user_metadata: { role: 'family' },
      },
    };
    const result = checkAuthAccess(session);
    expect(result.authenticated).toBe(true);
    expect(result.user?.role).toBe('family');
  });

  it('should default role to "unknown" when user_metadata has no role', () => {
    const session: Session = {
      user: {
        id: 'user-2',
        email: 'noone@example.com',
        user_metadata: {},
      },
    };
    const result = checkAuthAccess(session);
    expect(result.authenticated).toBe(true);
    expect(result.user?.role).toBe('unknown');
  });

  it('should authenticate admin users as well', () => {
    const session: Session = {
      user: {
        id: 'admin-1',
        email: 'admin@neuro-care.fr',
        user_metadata: { role: 'admin' },
      },
    };
    const result = checkAuthAccess(session);
    expect(result.authenticated).toBe(true);
    expect(result.user?.role).toBe('admin');
  });
});

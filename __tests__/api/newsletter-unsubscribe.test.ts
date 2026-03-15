import { validateUnsubscribeInput } from '../helpers/newsletter-validation';

describe('Newsletter unsubscribe input validation', () => {
  it('should reject when email is missing (undefined)', () => {
    const result = validateUnsubscribeInput(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject when email is an empty string', () => {
    const result = validateUnsubscribeInput('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject when email is whitespace only', () => {
    const result = validateUnsubscribeInput('   ');
    expect(result.valid).toBe(false);
  });

  it('should reject an invalid email format', () => {
    const result = validateUnsubscribeInput('not-an-email');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email invalide');
  });

  it('should accept a valid email and normalize it to lowercase/trimmed', () => {
    const result = validateUnsubscribeInput('  User@Example.COM  ');
    expect(result.valid).toBe(true);
    expect(result.normalizedEmail).toBe('user@example.com');
  });

  it('should reject non-string values (number)', () => {
    const result = validateUnsubscribeInput(12345);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should accept a simple valid email', () => {
    const result = validateUnsubscribeInput('test@neuro-care.fr');
    expect(result.valid).toBe(true);
    expect(result.normalizedEmail).toBe('test@neuro-care.fr');
  });
});

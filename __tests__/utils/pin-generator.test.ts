import { generateSecurePIN, addHours, FORBIDDEN_PINS } from '../helpers/pin-generator';

describe('generateSecurePIN', () => {
  it('should return a 4-digit string', () => {
    const pin = generateSecurePIN();
    expect(pin).toMatch(/^\d{4}$/);
  });

  it('should never return a forbidden PIN sequence', () => {
    // Run many iterations to gain confidence
    for (let i = 0; i < 500; i++) {
      const pin = generateSecurePIN();
      expect(FORBIDDEN_PINS).not.toContain(pin);
    }
  });

  it('should always return a PIN >= 1000 (no leading zeros from the generator range)', () => {
    for (let i = 0; i < 200; i++) {
      const pin = generateSecurePIN();
      expect(Number(pin)).toBeGreaterThanOrEqual(1000);
      expect(Number(pin)).toBeLessThanOrEqual(9999);
    }
  });

  it('should produce varying PINs (not always the same value)', () => {
    const pins = new Set<string>();
    for (let i = 0; i < 50; i++) {
      pins.add(generateSecurePIN());
    }
    // With 50 draws from ~8986 valid values, we expect many distinct values
    expect(pins.size).toBeGreaterThan(10);
  });
});

describe('addHours', () => {
  it('should add the specified number of hours', () => {
    const base = new Date('2025-06-15T10:00:00Z');
    const result = addHours(base, 2);
    expect(result.getTime() - base.getTime()).toBe(2 * 60 * 60 * 1000);
  });

  it('should not mutate the original date', () => {
    const base = new Date('2025-06-15T10:00:00Z');
    const originalTime = base.getTime();
    addHours(base, 5);
    expect(base.getTime()).toBe(originalTime);
  });

  it('should handle zero hours', () => {
    const base = new Date('2025-06-15T10:00:00Z');
    const result = addHours(base, 0);
    expect(result.getTime()).toBe(base.getTime());
  });
});

import crypto from 'crypto';

/**
 * Generates a secure PIN code of the specified length using crypto.randomBytes.
 * Rejects common weak PINs (repeated digits, simple sequences).
 */
export function generateSecurePin(length: number = 4): string {
  const forbidden = [
    '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '0123', '9876'
  ];

  let pin: string;
  do {
    const bytes = crypto.randomBytes(length);
    pin = '';
    for (let i = 0; i < length; i++) {
      pin += (bytes[i] % 10).toString();
    }
  } while (forbidden.includes(pin));

  return pin;
}

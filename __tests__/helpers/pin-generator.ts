/**
 * Extracted from app/api/appointments/create-with-payment/route.ts
 * Generates a secure 4-digit PIN code, excluding forbidden sequences.
 */
export function generateSecurePIN(): string {
  const forbidden = [
    '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '0123', '9876'
  ];

  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (forbidden.includes(pin));

  return pin;
}

/**
 * Extracted from app/api/appointments/create-with-payment/route.ts
 * Adds a specified number of hours to a Date object.
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * The list of forbidden PIN sequences, exported for testing.
 */
export const FORBIDDEN_PINS = [
  '0000', '1111', '2222', '3333', '4444',
  '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '9876'
];

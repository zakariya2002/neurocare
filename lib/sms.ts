import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(to: string, message: string): Promise<SmsResult>;
}

/**
 * Format a phone number to E.164 (e.g. +33612345678).
 * Returns null if invalid.
 */
export function formatPhoneE164(phone: string, defaultCountry: 'FR' | 'BE' | 'CH' | 'LU' = 'FR'): string | null {
  if (!phone) return null;
  const parsed = parsePhoneNumberFromString(phone, defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export function isValidPhone(phone: string, defaultCountry: 'FR' | 'BE' | 'CH' | 'LU' = 'FR'): boolean {
  if (!phone) return false;
  try {
    return isValidPhoneNumber(phone, defaultCountry);
  } catch {
    return false;
  }
}

class TwilioProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async send(to: string, message: string): Promise<SmsResult> {
    try {
      const formatted = formatPhoneE164(to);
      if (!formatted) {
        return { success: false, error: `Invalid phone number: ${to}` };
      }

      // Lazy import to avoid bundling Twilio SDK in client builds
      const twilio = (await import('twilio')).default;
      const client = twilio(this.accountSid, this.authToken);

      const result = await client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formatted,
      });

      return { success: true, messageId: result.sid };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }
}

class MockProvider implements SmsProvider {
  async send(to: string, message: string): Promise<SmsResult> {
    const formatted = formatPhoneE164(to) ?? to;
    console.log(`[SMS MOCK] → ${formatted}: ${message}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}

function buildProvider(): SmsProvider {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (sid && token && from) {
    return new TwilioProvider(sid, token, from);
  }
  return new MockProvider();
}

export const sms: SmsProvider = buildProvider();

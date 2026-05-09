import { google, calendar_v3 } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// TODO: encrypt tokens at rest using Supabase Vault when available
// For MVP, tokens are stored as TEXT in Supabase with RLS protection.

const GOOGLE_AUTH_URL = 'https://oauth2.googleapis.com/token';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google Calendar OAuth env vars not set: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI');
  }
  return { clientId, clientSecret, redirectUri };
}

function getOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getEnv();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // forces refresh_token even on subsequent auths
    scope: GOOGLE_SCOPES,
    state,
  });
}

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Missing access_token or refresh_token from Google');
  }
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
    token_type: tokens.token_type || 'Bearer',
    scope: tokens.scope || '',
  };
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch Google user info: ${res.status}`);
  const data = (await res.json()) as { email: string };
  return data.email;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const { clientId, clientSecret } = getEnv();
  const res = await fetch(GOOGLE_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh Google access token: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data;
}

/**
 * Returns a valid access_token for a user. Refreshes if expired.
 * Uses service role client (bypass RLS) — caller must verify auth.
 */
export async function getValidAccessToken(userId: string): Promise<{ accessToken: string; calendarId: string } | null> {
  const supabase = getServiceClient();
  const { data: token } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!token) return null;

  const expiresAt = new Date(token.expires_at).getTime();
  const now = Date.now();
  // Refresh if expires in less than 60s
  if (expiresAt - now < 60_000) {
    try {
      const { access_token, expires_in } = await refreshAccessToken(token.refresh_token);
      const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
      await supabase
        .from('google_oauth_tokens')
        .update({ access_token, expires_at: newExpiresAt, last_error: null })
        .eq('user_id', userId);
      return { accessToken: access_token, calendarId: token.calendar_id || 'primary' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'refresh failed';
      await supabase.from('google_oauth_tokens').update({ last_error: msg }).eq('user_id', userId);
      console.error('[google-calendar] refresh failed for user', userId, msg);
      return null;
    }
  }
  return { accessToken: token.access_token, calendarId: token.calendar_id || 'primary' };
}

function calendarClient(accessToken: string): calendar_v3.Calendar {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
}

export async function createCalendarEvent(userId: string, eventData: CalendarEventInput): Promise<string | null> {
  const tokenInfo = await getValidAccessToken(userId);
  if (!tokenInfo) return null;
  try {
    const cal = calendarClient(tokenInfo.accessToken);
    const res = await cal.events.insert({
      calendarId: tokenInfo.calendarId,
      requestBody: eventData,
    });
    return res.data.id || null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'create event failed';
    console.error('[google-calendar] createCalendarEvent failed', msg);
    return null;
  }
}

export async function updateCalendarEvent(userId: string, eventId: string, eventData: CalendarEventInput): Promise<boolean> {
  const tokenInfo = await getValidAccessToken(userId);
  if (!tokenInfo) return false;
  try {
    const cal = calendarClient(tokenInfo.accessToken);
    await cal.events.update({
      calendarId: tokenInfo.calendarId,
      eventId,
      requestBody: eventData,
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'update event failed';
    console.error('[google-calendar] updateCalendarEvent failed', msg);
    return false;
  }
}

export async function deleteCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const tokenInfo = await getValidAccessToken(userId);
  if (!tokenInfo) return false;
  try {
    const cal = calendarClient(tokenInfo.accessToken);
    await cal.events.delete({ calendarId: tokenInfo.calendarId, eventId });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'delete event failed';
    console.error('[google-calendar] deleteCalendarEvent failed', msg);
    return false;
  }
}

export interface BusyTime {
  start: string;
  end: string;
}

export async function listBusyTimes(userId: string, timeMin: string, timeMax: string): Promise<BusyTime[]> {
  const tokenInfo = await getValidAccessToken(userId);
  if (!tokenInfo) return [];
  try {
    const cal = calendarClient(tokenInfo.accessToken);
    const res = await cal.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: tokenInfo.calendarId }],
      },
    });
    const cals = res.data.calendars || {};
    const cur = cals[tokenInfo.calendarId];
    const busy = cur?.busy || [];
    return busy
      .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
      .map((b) => ({ start: b.start, end: b.end }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'freebusy failed';
    console.error('[google-calendar] listBusyTimes failed', msg);
    return [];
  }
}

export async function revokeGoogleToken(refreshToken: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (err) {
    console.warn('[google-calendar] revoke failed (non-blocking)', err);
  }
}

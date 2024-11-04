import { google } from 'googleapis';
import cookie from 'cookie';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number | null;
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: 'strict',
  path: '/'
} as const;

export class TokenManager {
  static getOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_REDIRECT_URL}/auth/callback`
    );
  }

  static async refreshAccessToken(oauth2Client: any) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  static async validateToken(token: TokenData) {
    try {
      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials(token);
      
      const tokenInfo = await oauth2Client.getTokenInfo(token.access_token);
      return tokenInfo.expiry_date > Date.now();
    } catch (error) {
      return false;
    }
  }

  static getTokenFromCookies(cookies: { [key: string]: string }): TokenData {
    return {
      access_token: cookies.access_token,
      refresh_token: cookies.refresh_token,
      expiry_date: cookies.expiry_date ? parseInt(cookies.expiry_date, 10) : null
    };
  }

  static createCookies(credentials: any) {
    return [
      cookie.serialize('access_token', credentials.access_token, AUTH_COOKIE_OPTIONS),
      cookie.serialize('refresh_token', credentials.refresh_token, AUTH_COOKIE_OPTIONS),
      cookie.serialize('expiry_date', credentials.expiry_date.toString(), AUTH_COOKIE_OPTIONS)
    ];
  }

  static clearTokenCookies() {
    return Object.keys(AUTH_COOKIE_OPTIONS).map(key => 
      cookie.serialize(key, '', { ...AUTH_COOKIE_OPTIONS, maxAge: 0 })
    );
  }
}

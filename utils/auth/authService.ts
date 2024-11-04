// EDIT AUTH SERVICE CONFIGURATION HERE
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import cookie from 'cookie';
import { TokenManager } from './tokenManager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class AuthService {
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/gmail.readonly'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  static async handleAuthCallback(code: string) {
    try {
      const oauth2Client = TokenManager.getOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  }

  static async validateSession(req: any) {
    try {
      const cookies = cookie.parse(req.headers.cookie || '');
      const token = TokenManager.getTokenFromCookies(cookies);

      if (!token.access_token || !token.refresh_token) {
        throw new AuthError('No valid tokens found');
      }

      const isValid = await TokenManager.validateToken(token);
      if (!isValid) {
        const oauth2Client = TokenManager.getOAuth2Client();
        oauth2Client.setCredentials(token);
        const newCredentials = await TokenManager.refreshAccessToken(oauth2Client);
        return { 
          isValid: true, 
          credentials: newCredentials 
        };
      }

      return { 
        isValid: true, 
        credentials: token 
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getUserProfile() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
}

export class AuthError extends Error {
  code: string;

  constructor(message: string, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

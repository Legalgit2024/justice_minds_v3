import { google } from 'googleapis';
import { EmailCache } from './emailCache';
import { EmailError } from './types';
import { processEmailMessage, extractEmailContent } from './emailProcessor';
import type { EmailOptions, EmailResult, EmailAttachment } from './types';

export class EmailService {
  private gmail: any;
  private cache: EmailCache;

  constructor(auth: any) {
    this.gmail = google.gmail({ version: 'v1', auth });
    this.cache = new EmailCache();
  }

  static async initialize(credentials: any) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_REDIRECT_URL}/auth/callback`
    );
    
    oauth2Client.setCredentials(credentials);
    return new EmailService(oauth2Client);
  }

  async fetchEmails(options: EmailOptions): Promise<EmailResult> {
    try {
      const cacheKey = `${options.label}-${options.pageToken}-${options.includeLabels}`;
      if (options.useCache) {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) return cachedResult;
      }

      const query = this.buildQuery(options.label);
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: options.maxResults || 100,
        pageToken: options.pageToken,
        labelIds: options.includeLabels ? [options.label] : undefined
      });

      const messages = response.data.messages || [];
      const emailDetails = await this.processMessages(messages);

      const result = {
        emails: emailDetails,
        nextPageToken: response.data.nextPageToken || null
      };

      if (options.useCache) {
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('Email fetch error:', error);
      throw new EmailError('Failed to fetch emails', 'FETCH_ERROR');
    }
  }

  private buildQuery(label?: string): string {
    if (label === 'SENT') return 'in:sent';
    if (label === 'INBOX') return 'in:inbox';
    return label ? `label:${label}` : '';
  }

  private async processMessages(messages: any[]) {
    const emailDetails = await Promise.all(
      messages.map(async (message) => {
        try {
          const email = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          return processEmailMessage(email.data);
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          return null;
        }
      })
    );

    return emailDetails.filter(email => email !== null);
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<EmailAttachment> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId
      });

      return {
        data: response.data.data,
        size: response.data.size
      };
    } catch (error) {
      console.error('Attachment fetch error:', error);
      throw new EmailError('Failed to fetch attachment', 'ATTACHMENT_ERROR');
    }
  }

  async searchEmails(query: string, options: EmailOptions = {}) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: options.maxResults || 100,
        pageToken: options.pageToken,
        labelIds: options.labelIds
      });

      const messages = response.data.messages || [];
      const emailDetails = await this.processMessages(messages);

      return {
        emails: emailDetails,
        nextPageToken: response.data.nextPageToken || null
      };
    } catch (error) {
      console.error('Email search error:', error);
      throw new EmailError('Failed to search emails', 'SEARCH_ERROR');
    }
  }
}

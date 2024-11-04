import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { ShareOptions, ShareResult, ShareData } from './types';
import { ShareError } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class ShareService {
  static async createShareLink(emailId: string, options: ShareOptions): Promise<ShareResult> {
    try {
      const shareId = uuidv4();
      const expiresAt = options.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('shared_emails')
        .insert([
          {
            share_id: shareId,
            email_id: emailId,
            created_by: options.userId,
            expires_at: expiresAt,
            name: options.name || 'Unnamed Share',
            access_count: 0,
            is_active: true
          }
        ]);

      if (error) throw error;

      return {
        shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareId}`,
        shareId,
        expiresAt
      };
    } catch (error) {
      console.error('Share creation error:', error);
      throw new ShareError('Failed to create share link', 'SHARE_CREATE_ERROR');
    }
  }

  static async getSharedEmail(shareId: string): Promise<ShareData> {
    try {
      const { data: shareData, error: shareError } = await supabase
        .from('shared_emails')
        .select('*')
        .eq('share_id', shareId)
        .single();

      if (shareError) throw shareError;
      if (!shareData) throw new ShareError('Share not found', 'SHARE_NOT_FOUND');

      if (!shareData.is_active) {
        throw new ShareError('Share has been deactivated', 'SHARE_INACTIVE');
      }
      if (new Date(shareData.expires_at) < new Date()) {
        throw new ShareError('Share has expired', 'SHARE_EXPIRED');
      }

      await this.incrementAccessCount(shareId, shareData.access_count);

      return shareData;
    } catch (error) {
      console.error('Share retrieval error:', error);
      throw error;
    }
  }

  private static async incrementAccessCount(shareId: string, currentCount: number) {
    await supabase
      .from('shared_emails')
      .update({ access_count: currentCount + 1 })
      .eq('share_id', shareId);
  }

  static async cancelShare(shareId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('shared_emails')
        .update({ is_active: false })
        .eq('share_id', shareId)
        .eq('created_by', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Share cancellation error:', error);
      throw new ShareError('Failed to cancel share', 'SHARE_CANCEL_ERROR');
    }
  }

  static async listShares(userId: string): Promise<ShareData[]> {
    try {
      const { data, error } = await supabase
        .from('shared_emails')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Share list error:', error);
      throw new ShareError('Failed to list shares', 'SHARE_LIST_ERROR');
    }
  }

  static async updateShareName(shareId: string, userId: string, name: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shared_emails')
        .update({ name })
        .eq('share_id', shareId)
        .eq('created_by', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Share update error:', error);
      throw new ShareError('Failed to update share name', 'SHARE_UPDATE_ERROR');
    }
  }
}

export interface ShareOptions {
  userId: string;
  name?: string;
  expiresAt?: Date;
}

export interface ShareResult {
  shareLink: string;
  shareId: string;
  expiresAt: Date;
}

export interface ShareData {
  share_id: string;
  email_id: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  name: string;
  access_count: number;
  is_active: boolean;
}

export class ShareError extends Error {
  code: string;

  constructor(message: string, code = 'SHARE_ERROR') {
    super(message);
    this.name = 'ShareError';
    this.code = code;
  }
}

export interface EmailOptions {
  label?: string;
  pageToken?: string | null;
  includeLabels?: boolean;
  useCache?: boolean;
  maxResults?: number;
  labelIds?: string[];
}

export interface EmailResult {
  emails: EmailDetail[];
  nextPageToken: string | null;
}

export interface EmailDetail {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress;
  subject: string;
  date: string;
  body: EmailBody;
  attachments: EmailAttachment[];
  labels: string[];
}

export interface EmailAddress {
  name: string;
  email: string;
}

export interface EmailBody {
  mimeType: string;
  content: string;
}

export interface EmailAttachment {
  data?: string;
  size: number;
  filename?: string;
  mimeType?: string;
  attachmentId?: string;
}

export class EmailError extends Error {
  code: string;

  constructor(message: string, code = 'EMAIL_ERROR') {
    super(message);
    this.name = 'EmailError';
    this.code = code;
  }
}

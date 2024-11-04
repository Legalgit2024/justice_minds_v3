import type { EmailDetail, EmailAddress, EmailBody, EmailAttachment } from './types';

export function processEmailMessage(message: any): EmailDetail {
  const headers = message.payload.headers;
  const { from, to, subject, date } = extractHeaders(headers);
  const body = extractBody(message.payload);
  const attachments = extractAttachments(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    to,
    subject,
    date,
    body,
    attachments,
    labels: message.labelIds || []
  };
}

function extractHeaders(headers: any[]): {
  from: EmailAddress;
  to: EmailAddress;
  subject: string;
  date: string;
} {
  const getHeader = (name: string): string => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };

  return {
    from: parseEmailAddress(getHeader('from')),
    to: parseEmailAddress(getHeader('to')),
    subject: getHeader('subject'),
    date: getHeader('date')
  };
}

function parseEmailAddress(value: string): EmailAddress {
  const nameEmailMatch = value.match(/(.+?)\s*<(.+?)>/);
  if (nameEmailMatch) {
    return {
      name: nameEmailMatch[1].trim().replace(/^["']|["']$/g, ''),
      email: nameEmailMatch[2]
    };
  }
  return { name: '', email: value };
}

function extractBody(payload: any): EmailBody {
  const parts: { mimeType: string; content: string }[] = [];
  
  const extractParts = (part: any) => {
    if (part.parts) {
      part.parts.forEach(extractParts);
    }
    if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
      const body = part.body.data
        ? Buffer.from(part.body.data, 'base64').toString()
        : '';
      parts.push({ mimeType: part.mimeType, content: body });
    }
  };

  extractParts(payload);
  
  // Prefer HTML content if available
  const htmlPart = parts.find(p => p.mimeType === 'text/html');
  const plainPart = parts.find(p => p.mimeType === 'text/plain');
  
  return htmlPart || plainPart || { mimeType: 'text/plain', content: '' };
}

function extractAttachments(payload: any): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];
  
  const extractAttachmentParts = (part: any) => {
    if (part.parts) {
      part.parts.forEach(extractAttachmentParts);
    }
    if (part.filename && part.body) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
        attachmentId: part.body.attachmentId
      });
    }
  };

  extractAttachmentParts(payload);
  return attachments;
}

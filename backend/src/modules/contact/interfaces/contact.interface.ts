export const ContactStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;

export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactListOptions {
  skip: number;
  take: number;
  status?: ContactStatus;
  search?: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface DemoUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  enabled: boolean;
  passwordResetToken?: string | null;
  passwordResetTokenExpiresAt?: string | null;
}

export interface DemoClient {
  id: number;
  userId: number;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export interface DemoInvoice {
  id: number;
  userId: number;
  clientId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
}

export interface DemoInvitation {
  id: number;
  clientId: number;
  createdByUserId: number;
  invitationCode: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  sentAt?: string | null;
}

export interface DemoPortalAccount {
  id: number;
  clientId: number;
  email: string;
  password: string;
  enabled: boolean;
  createdAt: string;
  lastLogin?: string | null;
}

export interface DemoInboxMessage {
  id: number;
  type: 'INVITATION' | 'REGENERATION' | 'PASSWORD_RESET';
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  invitationCode?: string;
  resetToken?: string;
  actionUrl: string;
  read: boolean;
  createdAt: string;
}

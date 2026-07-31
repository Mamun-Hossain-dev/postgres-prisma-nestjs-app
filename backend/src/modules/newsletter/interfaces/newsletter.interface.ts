export const SubscriberStatus = {
  ACTIVE: 'ACTIVE',
  UNSUBSCRIBED: 'UNSUBSCRIBED',
} as const;

export type SubscriberStatus =
  (typeof SubscriberStatus)[keyof typeof SubscriberStatus];

export const BroadcastStatus = {
  SENDING: 'SENDING',
  SENT: 'SENT',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
} as const;

export type BroadcastStatus =
  (typeof BroadcastStatus)[keyof typeof BroadcastStatus];

export const DeliveryStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type DeliveryStatus =
  (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterDelivery {
  id: number;
  broadcastId: number;
  email: string;
  status: DeliveryStatus;
  error: string | null;
  sentAt: Date | null;
}

export interface NewsletterBroadcast {
  id: number;
  subject: string;
  previewText: string | null;
  content: string;
  status: BroadcastStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BroadcastWithDeliveries extends NewsletterBroadcast {
  deliveries: NewsletterDelivery[];
}

export interface CreateBroadcastInput {
  subject: string;
  previewText?: string;
  content: string;
}

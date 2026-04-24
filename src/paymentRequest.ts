import type { StableTokenConfig } from "./tokens";

export type StablePayLineItem = {
  id?: string;
  label: string;
  description?: string;
  quantity?: number;
  unitAmount?: number;
  amount: number;
};

export type StablePayPaymentRequestStatus =
  | "draft"
  | "open"
  | "paid"
  | "expired"
  | "cancelled";

export type StablePayPaymentRequest<TMetadata = Record<string, unknown>> = {
  id?: string;
  sessionId?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  message?: string;
  note?: string;
  imageUrl?: string;
  amount: number;
  currency?: string;
  token: StableTokenConfig;
  recipient: string;
  reference: string;
  lineItems: StablePayLineItem[];
  status: StablePayPaymentRequestStatus;
  metadata?: TMetadata;
  createdAt?: string;
  expiresAt?: string;
};

export type StablePayPaymentRequestInput<
  TMetadata = Record<string, unknown>,
> = {
  id?: string;
  sessionId?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  message?: string;
  note?: string;
  imageUrl?: string;
  amount?: number;
  currency?: string;
  token?: StableTokenConfig;
  recipient: string;
  reference: string;
  lineItems?: StablePayLineItem[];
  status?: StablePayPaymentRequestStatus;
  metadata?: TMetadata;
  createdAt?: string;
  expiresAt?: string;
};

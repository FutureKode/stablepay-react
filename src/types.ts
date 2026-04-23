import type React from "react";
import type { StableTokenConfig } from "./tokens";

export type StablePaySuccessPayload<TMetadata = undefined> = {
  signature: string;
  amount: number;
  to: string;
  reference: string;
  token: StableTokenConfig;
  metadata?: TMetadata;
};

export type StablePayPayArgs<TMetadata = undefined> = {
  amount: number;
  to: string;
  reference: string;
  token?: StableTokenConfig;
  metadata?: TMetadata;
  onSuccess?: (payload: StablePaySuccessPayload<TMetadata>) => void;
  onError?: (error: Error) => void;
};

export type StablePayProviderProps = {
  children: React.ReactNode;
  endpoint?: string;
  to?: string;
};

export type StablePayProps<TMetadata = undefined> = {
  amount: number;
  to?: string;
  reference: string;
  token?: StableTokenConfig;
  metadata?: TMetadata;
  disabled?: boolean;
  children: React.ReactElement<{
    onClick?: (event: React.MouseEvent) => void;
    disabled?: boolean;
  }>;
  onSuccess?: (payload: StablePaySuccessPayload<TMetadata>) => void;
  onError?: (error: Error) => void;
};

export type UseStablePayResult<TMetadata = undefined> = {
  pay: (args: StablePayPayArgs<TMetadata>) => Promise<string | undefined>;
  loading: boolean;
  error: Error | null;
  signature: string | null;
};

export type VerifyPaymentInput = {
  to: string;
  amount: string; // human-readable, e.g. "25.00"
  txHash: string;
  reference: string;
  token?: StableTokenConfig;
};

export type VerifyPaymentResult =
  | {
      ok: true;
      status: "confirmed" | "pending";
      txHash: string;
      to: string;
      amount: string;
      reference: string;
      confirmations: number;
    }
  | {
      ok: false;
      reason:
        | "TX_FAILED"
        | "TO_MISMATCH"
        | "AMOUNT_TOO_LOW"
        | "REFERENCE_MISMATCH"
        | "INVALID_TRANSACTION";
      txHash: string;
    };

/**
 * Internal shape after parsing a Solana tx
 */
export type ParsedPayment = {
  txHash: string;
  status: "confirmed" | "pending" | "failed";
  to: string;
  amount: string;
  reference: string;
  rawReference: string;
  confirmations: number;
  token: StableTokenConfig;
  timestamp?: number;
};

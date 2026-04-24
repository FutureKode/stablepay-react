import type React from "react";
import type { StableTokenConfig } from "./tokens";

export type StablePayErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "INVALID_RECIPIENT"
  | "INSUFFICIENT_SOL"
  | "INSUFFICIENT_TOKEN_BALANCE"
  | "RECIPIENT_NOT_READY"
  | "USER_REJECTED"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export type StablePayNormalizedError = {
  code: StablePayErrorCode;
  message: string;
};

export type StablePayStatus =
  | "idle"
  | "awaiting_wallet"
  | "preparing"
  | "submitting"
  | "confirming"
  | "confirmed"
  | "failed";

export type StablePaySuccessPayload<TMetadata = undefined> = {
  signature: string;
  amount: number;
  to: string;
  reference: string;
  token: StableTokenConfig;
  metadata?: TMetadata;
};

export type StablePayEvent<TMetadata = undefined> =
  | {
      type: "wallet_prompt_opened";
      amount: number;
      to: string;
      reference: string;
      token: StableTokenConfig;
      metadata?: TMetadata;
    }
  | {
      type: "transaction_preparing";
      amount: number;
      to: string;
      reference: string;
      token: StableTokenConfig;
      metadata?: TMetadata;
    }
  | {
      type: "transaction_submitting";
      amount: number;
      to: string;
      reference: string;
      token: StableTokenConfig;
      metadata?: TMetadata;
    }
  | ({
      type: "transaction_submitted";
    } & StablePaySuccessPayload<TMetadata>)
  | ({
      type: "payment_confirmed";
    } & StablePaySuccessPayload<TMetadata>)
  | {
      type: "payment_failed";
      error: Error;
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
  createRecipientTokenAccount?: boolean;
  metadata?: TMetadata;
  onEvent?: (event: StablePayEvent<TMetadata>) => void;
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
  createRecipientTokenAccount?: boolean;
  metadata?: TMetadata;
  disabled?: boolean;
  children: React.ReactElement<{
    onClick?: (event: React.MouseEvent) => void;
    disabled?: boolean;
  }>;
  onEvent?: (event: StablePayEvent<TMetadata>) => void;
  onSuccess?: (payload: StablePaySuccessPayload<TMetadata>) => void;
  onError?: (error: Error) => void;
};

export type UseStablePayResult<TMetadata = undefined> = {
  pay: (args: StablePayPayArgs<TMetadata>) => Promise<string | undefined>;
  loading: boolean;
  error: Error | null;
  signature: string | null;
  status: StablePayStatus;
  reset: () => void;
};

export type StablePayPreflightCode =
  | "READY"
  | "TOKEN_NOT_CONFIGURED"
  | "INSUFFICIENT_SOL"
  | "TOKEN_ACCOUNT_NOT_FOUND"
  | "INSUFFICIENT_TOKEN_BALANCE"
  | "RECIPIENT_NOT_READY";

export type StablePayPreflightIssue = {
  code: Exclude<StablePayPreflightCode, "READY">;
  message: string;
};

export type StablePayPreflightResult = {
  ok: boolean;
  code: StablePayPreflightCode;
  message: string;
  issues: StablePayPreflightIssue[];
  token: StableTokenConfig;
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

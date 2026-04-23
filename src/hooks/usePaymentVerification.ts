import { useCallback, useState } from "react";
import type { StablePaySuccessPayload, VerifyPaymentResult } from "../types";
import { waitForPaymentConfirmation } from "../waitForPaymentConfirmation";

export type PaymentVerificationStatus =
  | "idle"
  | "verifying"
  | "pending"
  | "confirmed"
  | "failed";

export type UsePaymentVerificationOptions = {
  maxAttempts?: number;
  intervalMs?: number;
};

export type UsePaymentVerificationResult = {
  status: PaymentVerificationStatus;
  result: VerifyPaymentResult | null;
  error: Error | null;
  verify: <TMetadata = undefined>(
    payload: StablePaySuccessPayload<TMetadata>,
  ) => Promise<VerifyPaymentResult>;
  reset: () => void;
};

export function usePaymentVerification(
  options: UsePaymentVerificationOptions = {},
): UsePaymentVerificationResult {
  const [status, setStatus] = useState<PaymentVerificationStatus>("idle");
  const [result, setResult] = useState<VerifyPaymentResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const verify = useCallback(
    async <TMetadata = undefined>(payload: StablePaySuccessPayload<TMetadata>) => {
      setStatus("verifying");
      setError(null);

      try {
        const verificationResult = await waitForPaymentConfirmation(
          {
            to: payload.to,
            amount: String(payload.amount),
            txHash: payload.signature,
            reference: payload.reference,
            token: payload.token,
          },
          {
            maxAttempts: options.maxAttempts,
            intervalMs: options.intervalMs,
          },
        );

        setResult(verificationResult);

        if (verificationResult.ok) {
          setStatus(
            verificationResult.status === "confirmed" ? "confirmed" : "pending",
          );
        } else {
          setStatus("failed");
        }

        return verificationResult;
      } catch (err) {
        const nextError =
          err instanceof Error ? err : new Error("Payment verification failed");

        setError(nextError);
        setStatus("failed");
        throw nextError;
      }
    },
    [options.maxAttempts, options.intervalMs],
  );

  return {
    status,
    result,
    error,
    verify,
    reset,
  };
}

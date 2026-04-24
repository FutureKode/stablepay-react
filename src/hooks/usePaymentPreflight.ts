import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { runPaymentPreflight } from "../runPaymentPreflight";
import type { StablePayPreflightResult } from "../types";
import type { StableTokenConfig } from "../tokens";

type UsePaymentPreflightArgs = {
  amount: number;
  to: string;
  token?: StableTokenConfig;
  createRecipientTokenAccount?: boolean;
};

type UsePaymentPreflightResult = {
  check: (
    args?: Partial<UsePaymentPreflightArgs>,
  ) => Promise<StablePayPreflightResult>;
  loading: boolean;
  result: StablePayPreflightResult | null;
  error: Error | null;
};

export function usePaymentPreflight(
  defaults?: Partial<UsePaymentPreflightArgs>,
): UsePaymentPreflightResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StablePayPreflightResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const check = useCallback(
    async (args: Partial<UsePaymentPreflightArgs> = {}) => {
      if (!publicKey) {
        const nextError = new Error("Wallet not connected");
        setError(nextError);
        throw nextError;
      }

      const merged = { ...defaults, ...args };

      if (merged.amount == null || !merged.to) {
        const nextError = new Error(
          "usePaymentPreflight requires `amount` and `to`.",
        );
        setError(nextError);
        throw nextError;
      }

      setLoading(true);
      setError(null);

      try {
        const nextResult = await runPaymentPreflight({
          connection,
          fromWallet: publicKey.toBase58(),
          toWallet: merged.to,
          amount: merged.amount,
          token: merged.token,
          createRecipientTokenAccount: merged.createRecipientTokenAccount,
        });

        setResult(nextResult);
        return nextResult;
      } catch (err) {
        const nextError =
          err instanceof Error ? err : new Error("Payment preflight failed");
        setError(nextError);
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [connection, defaults, publicKey],
  );

  return { check, loading, result, error };
}

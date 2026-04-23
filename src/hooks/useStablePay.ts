import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { buildTokenTransfer } from "../solana/buildTokenTransfer";
import { resolveStableTokenConfig } from "../tokens";
import type { StablePayPayArgs, UseStablePayResult } from "../types";

type PendingPayment<TMetadata> = StablePayPayArgs<TMetadata>;

export function useStablePay<TMetadata = undefined>(): UseStablePayResult<TMetadata> {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment<TMetadata> | null>(
    null,
  );

  const executePayment = useCallback(
    async ({ amount, to, reference, token }: StablePayPayArgs<TMetadata>) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      let recipient: PublicKey;

      try {
        recipient = new PublicKey(to);
      } catch {
        throw new Error("Invalid recipient wallet address");
      }

      const resolvedToken = resolveStableTokenConfig(token);

      const transaction = await buildTokenTransfer({
        connection,
        fromWallet: publicKey,
        toWallet: recipient,
        amount,
        reference,
        token: resolvedToken,
      });

      const sig = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(sig, "confirmed");

      setSignature(sig);
      return sig;
    },
    [publicKey, connection, sendTransaction],
  );

  const pay = useCallback(
    async ({
      amount,
      to,
      reference,
      token,
      metadata,
      onSuccess,
      onError,
    }: StablePayPayArgs<TMetadata>) => {
      setLoading(true);
      setSignature(null);
      setError(null);

      // Not connected → store intent + callbacks
      if (!connected || !publicKey) {
        setPendingPayment({
          amount,
          to,
          reference,
          token,
          metadata,
          onSuccess,
          onError,
        });
        setVisible(true);
        return;
      }

      try {
        const resolvedToken = resolveStableTokenConfig(token);
        const sig = await executePayment({
          amount,
          to,
          reference,
          token: resolvedToken,
          metadata,
        });
        onSuccess?.({
          signature: sig,
          amount,
          to,
          reference,
          token: resolvedToken,
          metadata,
        });
        return sig;
      } catch (err) {
        const normalized =
          err instanceof Error ? err : new Error("Payment failed");
        setError(normalized);
        onError?.(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [connected, publicKey, executePayment, setVisible],
  );

  // Resume after wallet connects
  useEffect(() => {
    if (!connected || !publicKey || !pendingPayment) return;

    const payment = pendingPayment;

    let cancelled = false;

    async function resumePayment() {
      try {
        const sig = await executePayment(payment);

        if (!cancelled) {
          payment.onSuccess?.({
            signature: sig,
            amount: payment.amount,
            to: payment.to,
            reference: payment.reference,
            token: resolveStableTokenConfig(payment.token),
            metadata: payment.metadata,
          });
          setSignature(sig);
          setPendingPayment(null);
        }
      } catch (err) {
        if (!cancelled) {
          const normalized =
            err instanceof Error ? err : new Error("Payment failed");
          setError(normalized);
          payment.onError?.(normalized);
          setPendingPayment(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    resumePayment();

    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, pendingPayment, executePayment]);

  return { pay, loading, error, signature };
}

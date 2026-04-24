import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { normalizeStablePayError } from "../errors";
import { buildTokenTransfer } from "../solana/buildTokenTransfer";
import { resolveStableTokenConfig } from "../tokens";
import type {
  StablePayEvent,
  StablePayPayArgs,
  StablePayStatus,
  UseStablePayResult,
} from "../types";

type PendingPayment<TMetadata> = StablePayPayArgs<TMetadata>;

export function useStablePay<TMetadata = undefined>(): UseStablePayResult<TMetadata> {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<StablePayStatus>("idle");
  const [pendingPayment, setPendingPayment] = useState<PendingPayment<TMetadata> | null>(
    null,
  );

  const reset = useCallback(() => {
    setLoading(false);
    setSignature(null);
    setError(null);
    setStatus("idle");
  }, []);

  const emitEvent = useCallback(
    (
      callback: StablePayPayArgs<TMetadata>["onEvent"] | undefined,
      event: StablePayEvent<TMetadata>,
    ) => {
      callback?.(event);
    },
    [],
  );

  const executePayment = useCallback(
    async ({
      amount,
      to,
      reference,
      token,
      createRecipientTokenAccount,
      metadata,
      onEvent,
    }: StablePayPayArgs<TMetadata>) => {
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

      setStatus("preparing");
      emitEvent(onEvent, {
        type: "transaction_preparing",
        amount,
        to,
        reference,
        token: resolvedToken,
        metadata,
      });

      const transaction = await buildTokenTransfer({
        connection,
        fromWallet: publicKey,
        toWallet: recipient,
        amount,
        reference,
        token: resolvedToken,
        createRecipientTokenAccount,
      });

      setStatus("submitting");
      emitEvent(onEvent, {
        type: "transaction_submitting",
        amount,
        to,
        reference,
        token: resolvedToken,
        metadata,
      });

      const sig = await sendTransaction(transaction, connection);
      setStatus("confirming");
      emitEvent(onEvent, {
        type: "transaction_submitted",
        signature: sig,
        amount,
        to,
        reference,
        token: resolvedToken,
        metadata,
      });
      await connection.confirmTransaction(sig, "confirmed");

      setSignature(sig);
      setStatus("confirmed");
      emitEvent(onEvent, {
        type: "payment_confirmed",
        signature: sig,
        amount,
        to,
        reference,
        token: resolvedToken,
        metadata,
      });
      return sig;
    },
    [publicKey, connection, sendTransaction, emitEvent],
  );

  const pay = useCallback(
    async ({
      amount,
      to,
      reference,
      token,
      createRecipientTokenAccount,
      metadata,
      onEvent,
      onSuccess,
      onError,
    }: StablePayPayArgs<TMetadata>) => {
      setLoading(true);
      setSignature(null);
      setError(null);
      setStatus("preparing");

      // Not connected → store intent + callbacks
      if (!connected || !publicKey) {
        const resolvedToken = resolveStableTokenConfig(token);
        setPendingPayment({
          amount,
          to,
          reference,
          token,
          createRecipientTokenAccount,
          metadata,
          onEvent,
          onSuccess,
          onError,
        });
        setStatus("awaiting_wallet");
        emitEvent(onEvent, {
          type: "wallet_prompt_opened",
          amount,
          to,
          reference,
          token: resolvedToken,
          metadata,
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
          createRecipientTokenAccount,
          metadata,
          onEvent,
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
        const normalized = normalizeStablePayError(err, token);
        const nextError = new Error(normalized.message);
        setError(nextError);
        setStatus("failed");
        emitEvent(onEvent, {
          type: "payment_failed",
          error: nextError,
          amount,
          to,
          reference,
          token: resolveStableTokenConfig(token),
          metadata,
        });
        onError?.(nextError);
        throw nextError;
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
          const normalized = normalizeStablePayError(err, payment.token);
          const nextError = new Error(normalized.message);
          setError(nextError);
          setStatus("failed");
          emitEvent(payment.onEvent, {
            type: "payment_failed",
            error: nextError,
            amount: payment.amount,
            to: payment.to,
            reference: payment.reference,
            token: resolveStableTokenConfig(payment.token),
            metadata: payment.metadata,
          });
          payment.onError?.(nextError);
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
  }, [connected, publicKey, pendingPayment, executePayment, emitEvent]);

  return { pay, loading, error, signature, status, reset };
}

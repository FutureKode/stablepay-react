import {
  resolveStableTokenConfig,
  type StableTokenConfig,
} from "./tokens";
import type { StablePayNormalizedError } from "./types";

export function normalizeStablePayError(
  error: unknown,
  token?: StableTokenConfig,
): StablePayNormalizedError {
  const resolvedToken = resolveStableTokenConfig(token);
  const tokenLabel = resolvedToken.symbol;

  if (!(error instanceof Error)) {
    return {
      code: "UNKNOWN",
      message: "Payment failed. Please try again.",
    };
  }

  const rawMessage = error.message?.trim() || "Payment failed. Please try again.";
  const msg = rawMessage.toLowerCase();

  if (msg.includes("wallet not connected")) {
    return {
      code: "WALLET_NOT_CONNECTED",
      message: "Connect your wallet to continue.",
    };
  }

  if (msg.includes("invalid recipient")) {
    return {
      code: "INVALID_RECIPIENT",
      message: "Invalid recipient wallet address.",
    };
  }

  if (
    msg.includes(`does not have a ${tokenLabel.toLowerCase()} token account`) ||
    msg.includes("recipient wallet does not have a token account")
  ) {
    return {
      code: "RECIPIENT_NOT_READY",
      message: `Recipient wallet is not ready to receive ${tokenLabel}.`,
    };
  }

  if (
    msg.includes("insufficient funds") ||
    msg.includes("not enough") ||
    msg.includes("token balance")
  ) {
    return {
      code: "INSUFFICIENT_TOKEN_BALANCE",
      message: `Not enough ${tokenLabel} to complete this payment.`,
    };
  }

  if (msg.includes("accountnotfound") || msg.includes("sol for transaction fees")) {
    return {
      code: "INSUFFICIENT_SOL",
      message: "Not enough SOL for network fees.",
    };
  }

  if (
    msg.includes("user rejected") ||
    msg.includes("user declined") ||
    msg.includes("rejected the request") ||
    msg.includes("cancelled")
  ) {
    return {
      code: "USER_REJECTED",
      message: "Payment cancelled in wallet.",
    };
  }

  if (msg.includes("blockhash") || msg.includes("network")) {
    return {
      code: "NETWORK_ERROR",
      message: "Network issue detected. Please try again.",
    };
  }

  return {
    code: "UNKNOWN",
    message: rawMessage,
  };
}

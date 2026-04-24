import { Connection, PublicKey } from "@solana/web3.js";
import { resolveStableTokenConfig, type StableTokenConfig } from "./tokens";
import { toTokenBaseUnits } from "./solana/amount";
import { getTokenAccountForWallet } from "./utils";
import type { StablePayPreflightIssue, StablePayPreflightResult } from "./types";

type RunPaymentPreflightInput = {
  connection: Connection;
  fromWallet: string;
  toWallet: string;
  amount: number;
  token?: StableTokenConfig;
  createRecipientTokenAccount?: boolean;
};

export async function runPaymentPreflight({
  connection,
  fromWallet,
  toWallet,
  amount,
  token,
  createRecipientTokenAccount = false,
}: RunPaymentPreflightInput): Promise<StablePayPreflightResult> {
  const resolvedToken = resolveStableTokenConfig(token);
  const issues: StablePayPreflightIssue[] = [];
  const feeBufferLamports = Math.ceil(0.001 * 1e9);

  const from = new PublicKey(fromWallet);
  const fromAta = getTokenAccountForWallet(fromWallet, resolvedToken);
  const toAta = getTokenAccountForWallet(toWallet, resolvedToken);

  const solBalance = await connection.getBalance(from);
  if (solBalance < feeBufferLamports) {
    issues.push({
      code: "INSUFFICIENT_SOL",
      message: "Not enough SOL for network fees.",
    });
  }

  const fromAtaInfo = await connection
    .getTokenAccountBalance(new PublicKey(fromAta))
    .catch(() => null);

  if (!fromAtaInfo) {
    issues.push({
      code: "TOKEN_ACCOUNT_NOT_FOUND",
      message: `No ${resolvedToken.symbol} token account found for the connected wallet.`,
    });
  } else {
    const balance = BigInt(fromAtaInfo.value.amount);
    const required = toTokenBaseUnits(amount, resolvedToken);

    if (balance < required) {
      issues.push({
        code: "INSUFFICIENT_TOKEN_BALANCE",
        message: `Not enough ${resolvedToken.symbol} to complete this payment.`,
      });
    }
  }

  const toAtaInfo = await connection.getAccountInfo(new PublicKey(toAta));
  if (!toAtaInfo && !createRecipientTokenAccount) {
    issues.push({
      code: "RECIPIENT_NOT_READY",
      message: `Recipient wallet is not ready to receive ${resolvedToken.symbol}.`,
    });
  }

  if (issues.length === 0) {
    return {
      ok: true,
      code: "READY",
      message: `Ready to pay with ${resolvedToken.symbol}.`,
      issues,
      token: resolvedToken,
    };
  }

  return {
    ok: false,
    code: issues[0].code,
    message: issues[0].message,
    issues,
    token: resolvedToken,
  };
}

import { VerifyPaymentInput, VerifyPaymentResult } from "./types";
import { parsePaymentFromTransaction } from "./parsePaymentFromTransaction";
import { resolveStableTokenConfig } from "./tokens";
import { amountGte, getTokenAccountForWallet, sameAddress } from "./utils";

export async function verifyPayment(
  input: VerifyPaymentInput,
): Promise<VerifyPaymentResult> {
  const token = resolveStableTokenConfig(input.token);
  const parsed = await parsePaymentFromTransaction(input.txHash, token);

  if (!parsed) {
    return {
      ok: false,
      reason: "INVALID_TRANSACTION",
      txHash: input.txHash,
    };
  }

  if (parsed.status === "failed") {
    return {
      ok: false,
      reason: "TX_FAILED",
      txHash: input.txHash,
    };
  }

  const expectedTokenAccount = getTokenAccountForWallet(input.to, token);

  if (!sameAddress(parsed.to, expectedTokenAccount)) {
    return {
      ok: false,
      reason: "TO_MISMATCH",
      txHash: input.txHash,
    };
  }

  if (!amountGte(parsed.amount, input.amount, token)) {
    return {
      ok: false,
      reason: "AMOUNT_TOO_LOW",
      txHash: input.txHash,
    };
  }

  if (parsed.reference !== input.reference) {
    return {
      ok: false,
      reason: "REFERENCE_MISMATCH",
      txHash: input.txHash,
    };
  }

  return {
    ok: true,
    status: parsed.status === "pending" ? "pending" : "confirmed",
    txHash: parsed.txHash,
    to: input.to,
    amount: parsed.amount,
    reference: parsed.reference,
    confirmations: parsed.confirmations,
  };
}

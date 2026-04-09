import { VerifyPaymentInput, VerifyPaymentResult } from "./types";
import { parseUsdcPaymentFromTransaction } from "./parseUsdcPaymentFromTransaction";
import { amountGte, getUsdcTokenAccountForWallet, sameAddress } from "./utils";

export async function verifyPayment(
  input: VerifyPaymentInput,
): Promise<VerifyPaymentResult> {
  const parsed = await parseUsdcPaymentFromTransaction(input.txHash);

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

  const expectedTokenAccount = getUsdcTokenAccountForWallet(input.to);

  if (!sameAddress(parsed.to, expectedTokenAccount)) {
    return {
      ok: false,
      reason: "TO_MISMATCH",
      txHash: input.txHash,
    };
  }

  if (!amountGte(parsed.amount, input.amount)) {
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

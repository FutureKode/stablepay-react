import { verifyPayment } from "./verifyPayment";
import { VerifyPaymentInput, VerifyPaymentResult } from "./types";

type WaitForPaymentConfirmationOptions = {
  maxAttempts?: number;
  intervalMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForPaymentConfirmation(
  input: VerifyPaymentInput,
  options: WaitForPaymentConfirmationOptions = {},
): Promise<VerifyPaymentResult> {
  const maxAttempts = options.maxAttempts ?? 10;
  const intervalMs = options.intervalMs ?? 1500;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await verifyPayment(input);

    if (result.ok && result.status === "confirmed") {
      return result;
    }

    if (result.ok && result.status === "pending") {
      await sleep(intervalMs);
      continue;
    }

    if (!result.ok && result.reason === "INVALID_TRANSACTION") {
      await sleep(intervalMs);
      continue;
    }

    return result;
  }

  return {
    ok: false,
    reason: "INVALID_TRANSACTION",
    txHash: input.txHash,
  };
}

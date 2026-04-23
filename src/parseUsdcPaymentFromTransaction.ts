import { parsePaymentFromTransaction } from "./parsePaymentFromTransaction";

export async function parseUsdcPaymentFromTransaction(txHash: string) {
  return parsePaymentFromTransaction(txHash);
}

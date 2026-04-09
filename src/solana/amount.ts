import { USDC_DECIMALS } from "./constants";

export function toTokenBaseUnits(amount: number): bigint {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const [whole, fraction = ""] = amount.toString().split(".");

  const paddedFraction = (fraction + "0".repeat(USDC_DECIMALS)).slice(
    0,
    USDC_DECIMALS,
  );

  const combined = whole + paddedFraction;

  return BigInt(combined);
}

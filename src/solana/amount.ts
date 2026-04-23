import { resolveStableTokenConfig, type StableTokenConfig } from "../tokens";

export function toTokenBaseUnits(
  amount: number,
  token: StableTokenConfig = resolveStableTokenConfig(),
): bigint {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const [whole, fraction = ""] = amount.toString().split(".");

  const paddedFraction = (fraction + "0".repeat(token.decimals)).slice(
    0,
    token.decimals,
  );

  const combined = whole + paddedFraction;

  return BigInt(combined);
}

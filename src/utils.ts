import { PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "./solana/constants";
import { resolveStableTokenConfig, type StableTokenConfig } from "./tokens";

export function getAssociatedTokenAddressSync(
  mint: PublicKey,
  owner: PublicKey,
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return address;
}

export function toAtomicUnits(
  amount: string,
  token: StableTokenConfig = resolveStableTokenConfig(),
): bigint {
  const [whole, fraction = ""] = amount.split(".");

  const paddedFraction = (fraction + "0".repeat(token.decimals)).slice(
    0,
    token.decimals,
  );

  return BigInt(whole) * 10n ** BigInt(token.decimals) + BigInt(paddedFraction);
}

export function amountGte(
  actual: string,
  expected: string,
  token: StableTokenConfig = resolveStableTokenConfig(),
): boolean {
  return toAtomicUnits(actual, token) >= toAtomicUnits(expected, token);
}

export function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function getTokenAccountForWallet(
  walletAddress: string,
  token: StableTokenConfig = resolveStableTokenConfig(),
): string {
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(token.mint);

  return getAssociatedTokenAddressSync(mint, wallet).toBase58();
}

export function getUsdcTokenAccountForWallet(walletAddress: string): string {
  return getTokenAccountForWallet(walletAddress);
}

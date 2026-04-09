import { PublicKey } from "@solana/web3.js";
import { SOLANA_USDC_MINT } from "./solana/constants";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

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

/**
 * Convert human-readable USDC to atomic units (6 decimals)
 */
export function toAtomicUnits(amount: string): bigint {
  const [whole, fraction = ""] = amount.split(".");

  const paddedFraction = (fraction + "000000").slice(0, 6);

  return BigInt(whole) * 1_000_000n + BigInt(paddedFraction);
}

export function amountGte(actual: string, expected: string): boolean {
  return toAtomicUnits(actual) >= toAtomicUnits(expected);
}

export function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function getUsdcTokenAccountForWallet(walletAddress: string): string {
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(SOLANA_USDC_MINT);

  return getAssociatedTokenAddressSync(mint, wallet).toBase58();
}

export type StableTokenConfig = {
  symbol: string;
  mint: string;
  decimals: number;
  name?: string;
};

export const USDC_TOKEN_CONFIG: StableTokenConfig = {
  symbol: "USDC",
  name: "USD Coin",
  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  decimals: 6,
};

export const SOLANA_USDC_MINT = USDC_TOKEN_CONFIG.mint;
export const USDC_DECIMALS = USDC_TOKEN_CONFIG.decimals;

export function resolveStableTokenConfig(
  token?: StableTokenConfig,
): StableTokenConfig {
  return token ?? USDC_TOKEN_CONFIG;
}

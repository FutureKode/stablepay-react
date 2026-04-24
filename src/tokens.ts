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

export const USDT_TOKEN_CONFIG: StableTokenConfig = {
  symbol: "USDT",
  name: "Tether USD",
  mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  decimals: 6,
};

export const TOKENS = {
  USDC: USDC_TOKEN_CONFIG,
  USDT: USDT_TOKEN_CONFIG,
} as const;

export const SOLANA_USDC_MINT = USDC_TOKEN_CONFIG.mint;
export const USDC_DECIMALS = USDC_TOKEN_CONFIG.decimals;

export function resolveStableTokenConfig(
  token?: StableTokenConfig,
): StableTokenConfig {
  return token ?? USDC_TOKEN_CONFIG;
}

export function getTokenConfig(symbol: keyof typeof TOKENS): StableTokenConfig {
  return TOKENS[symbol];
}

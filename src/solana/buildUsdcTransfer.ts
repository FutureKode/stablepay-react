import type { Connection, PublicKey } from "@solana/web3.js";
import { buildTokenTransfer } from "./buildTokenTransfer";

type BuildUsdcTransferParams = {
  connection: Connection;
  fromWallet: PublicKey;
  toWallet: PublicKey;
  amount: number;
  reference: string;
};

export async function buildUsdcTransfer(params: BuildUsdcTransferParams) {
  return buildTokenTransfer(params);
}

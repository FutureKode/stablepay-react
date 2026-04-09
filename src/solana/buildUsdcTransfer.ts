import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { toTokenBaseUnits } from "./amount";
import { USDC_DECIMALS, SOLANA_USDC_MINT } from "./constants";
import { encodeStablePayReference } from "../reference";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

type BuildUsdcTransferParams = {
  connection: Connection;
  fromWallet: PublicKey;
  toWallet: PublicKey;
  amount: number;
  reference: string;
};

function getAssociatedTokenAddressSync(
  mint: PublicKey,
  owner: PublicKey,
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return address;
}

function createTransferCheckedInstruction(
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  decimals: number,
): TransactionInstruction {
  const data = Buffer.alloc(10);
  data.writeUInt8(12, 0);
  data.writeBigUInt64LE(amount, 1);
  data.writeUInt8(decimals, 9);

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });
}

export async function buildUsdcTransfer({
  connection,
  fromWallet,
  toWallet,
  amount,
  reference,
}: BuildUsdcTransferParams) {
  const mint = new PublicKey(SOLANA_USDC_MINT);
  const fromAta = getAssociatedTokenAddressSync(mint, fromWallet);
  const toAta = getAssociatedTokenAddressSync(mint, toWallet);

  const tx = new Transaction();

  const encodedReference = encodeStablePayReference(reference);

  tx.add(
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(encodedReference),
    }),
  );

  const fromAtaInfo = await connection.getAccountInfo(fromAta);
  const toAtaInfo = await connection.getAccountInfo(toAta);

  if (!fromAtaInfo) {
    throw new Error("Connected wallet does not have a USDC token account.");
  }

  if (!toAtaInfo) {
    throw new Error("Recipient wallet does not have a USDC token account yet.");
  }

  tx.add(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      fromWallet,
      toTokenBaseUnits(amount),
      USDC_DECIMALS,
    ),
  );

  const latestBlockhash = await connection.getLatestBlockhash();
  tx.feePayer = fromWallet;
  tx.recentBlockhash = latestBlockhash.blockhash;

  const simulation = await connection.simulateTransaction(tx);

  console.log("SIM ERR", simulation.value.err);
  console.log("SIM LOGS", simulation.value.logs);

  return tx;
}

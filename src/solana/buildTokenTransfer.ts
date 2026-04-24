import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { encodeStablePayReference } from "../reference";
import { resolveStableTokenConfig, type StableTokenConfig } from "../tokens";
import { toTokenBaseUnits } from "./amount";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MEMO_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "./constants";
import { getAssociatedTokenAddressSync } from "../utils";

type BuildTokenTransferParams = {
  connection: Connection;
  fromWallet: PublicKey;
  toWallet: PublicKey;
  amount: number;
  reference: string;
  token?: StableTokenConfig;
  createRecipientTokenAccount?: boolean;
};

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

function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });
}

export async function buildTokenTransfer({
  connection,
  fromWallet,
  toWallet,
  amount,
  reference,
  token,
  createRecipientTokenAccount = false,
}: BuildTokenTransferParams) {
  const resolvedToken = resolveStableTokenConfig(token);
  const mint = new PublicKey(resolvedToken.mint);
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
    throw new Error(
      `Connected wallet does not have a ${resolvedToken.symbol} token account.`,
    );
  }

  if (!toAtaInfo) {
    if (!createRecipientTokenAccount) {
      throw new Error(
        `Recipient wallet does not have a ${resolvedToken.symbol} token account yet.`,
      );
    }

    tx.add(
      createAssociatedTokenAccountInstruction(fromWallet, toAta, toWallet, mint),
    );
  }

  tx.add(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      fromWallet,
      toTokenBaseUnits(amount, resolvedToken),
      resolvedToken.decimals,
    ),
  );

  const latestBlockhash = await connection.getLatestBlockhash();
  tx.feePayer = fromWallet;
  tx.recentBlockhash = latestBlockhash.blockhash;

  return tx;
}

import {
  Connection,
  ParsedInstruction,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import { ParsedPayment } from "./types";
import { DEFAULT_RPC } from "./provider/StablePayProvider";
import { SOLANA_USDC_MINT } from "./solana/constants";
import { decodeStablePayReference } from "./reference";

function isParsedInstruction(
  ix: ParsedInstruction | PartiallyDecodedInstruction,
): ix is ParsedInstruction {
  return "parsed" in ix;
}

export async function parseUsdcPaymentFromTransaction(
  txHash: string,
): Promise<ParsedPayment | null> {
  const connection = new Connection(DEFAULT_RPC, "confirmed");

  const tx = await connection.getParsedTransaction(txHash, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!tx || !tx.meta) return null;

  if (tx.meta.err) {
    return {
      txHash,
      status: "failed",
      to: "",
      amount: "0",
      confirmations: 0,
      reference: "",
      rawReference: "",
    };
  }

  const allInstructions = [
    ...tx.transaction.message.instructions,
    ...(tx.meta.innerInstructions?.flatMap((group) => group.instructions) ??
      []),
  ];

  let amount: string | null = null;
  let reference = "";
  let rawReference = "";
  let destinationTokenAccount: string | null = null;

  for (const ix of allInstructions) {
    if (!isParsedInstruction(ix)) continue;

    if (ix.program === "spl-token") {
      const parsedType = ix.parsed?.type;
      const info = ix.parsed?.info;

      if (
        (parsedType === "transfer" || parsedType === "transferChecked") &&
        info
      ) {
        const mint = info.mint;
        const rawAmount = info.tokenAmount?.amount ?? info.amount;

        if (mint === SOLANA_USDC_MINT && rawAmount) {
          destinationTokenAccount = info.destination;
          amount = (Number(rawAmount) / 1_000_000).toString();
        }
      }
    }

    if (ix.program === "spl-memo" && typeof ix.parsed === "string") {
      rawReference = ix.parsed;
      reference = decodeStablePayReference(rawReference) ?? "";
    }
  }

  if (!destinationTokenAccount || !amount) {
    return null;
  }

  const currentSlot = await connection.getSlot("confirmed");
  const confirmations = Math.max(0, currentSlot - tx.slot);

  return {
    txHash,
    status: confirmations > 0 ? "confirmed" : "pending",
    to: destinationTokenAccount,
    amount,
    reference,
    rawReference,
    confirmations,
    timestamp: tx.blockTime ? tx.blockTime * 1000 : undefined,
  };
}

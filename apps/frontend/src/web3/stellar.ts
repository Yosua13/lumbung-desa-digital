import { stellarConfig, getStellarExpertTxUrl } from "../config/stellar";
import { StellarTransaction } from "../types";
import { generateId, generateStellarTxHash } from "../utils";

export type StellarBusinessReference = StellarTransaction["business_reference_type"];

export interface StellarTransactionInput {
  referenceType: StellarBusinessReference;
  referenceId: string;
  operation: "LOCK_FUNDING" | "RELEASE_ESCROW" | "REFUND_ESCROW" | "POST_REPAYMENT" | "TOPUP_POOL" | "WITHDRAW" | "SIMULATED_EVENT";
  txHash?: string;
  status?: StellarTransaction["status"];
  ledgerSequence?: number;
  contractId?: string;
  idempotencyKey?: string;
}

export function createStellarTransactionRecord(input: StellarTransactionInput): StellarTransaction {
  const txHash = input.txHash || generateStellarTxHash();

  return {
    id: generateId("ST"),
    business_reference_type: input.referenceType,
    business_reference_id: input.referenceId,
    network: stellarConfig.network === "mainnet" ? "MAINNET" : "TESTNET",
    tx_hash: txHash,
    status: input.status || "SUCCESS",
    ledger_sequence: input.ledgerSequence || Math.floor(1300000 + Math.random() * 50000),
    submitted_at: new Date().toISOString(),
    operation: input.operation,
    contract_id: input.contractId || stellarConfig.poolEscrowContractId || undefined,
    explorer_url: getStellarExpertTxUrl(txHash),
    idempotency_key: input.idempotencyKey,
    is_live: Boolean(input.txHash && stellarConfig.enableLiveStellar),
  };
}

export async function submitSignedTransactionXdr(signedTxXdr: string): Promise<StellarTransactionInput> {
  const { rpc: StellarRpc, Transaction } = await import("@stellar/stellar-sdk");
  const stellarRpc = new StellarRpc.Server(stellarConfig.rpcUrl);
  const transaction = new Transaction(signedTxXdr, stellarConfig.networkPassphrase);
  const sendResult = await stellarRpc.sendTransaction(transaction);

  if ("errorResult" in sendResult) {
    throw new Error(`Stellar RPC rejected transaction: ${sendResult.errorResult}`);
  }

  return {
    referenceType: "INVOICE",
    referenceId: transaction.hash().toString("hex"),
    operation: "SIMULATED_EVENT",
    txHash: transaction.hash().toString("hex"),
    status: sendResult.status === "PENDING" ? "PENDING" : "SUCCESS",
  };
}

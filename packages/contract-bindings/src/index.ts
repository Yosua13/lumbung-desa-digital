import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCFPN3ZBAAOE2PGJH4OEPNMHT3DU4VLXEIEB22MKUKRM2CAQPWNTS47Y",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "Asset", values: void} | {tag: "InvoiceCounter", values: void} | {tag: "Invoice", values: readonly [u64]} | {tag: "Reputation", values: readonly [string]};


export interface Invoice {
  amount: i128;
  asset: string;
  created_at: u64;
  due_timestamp: u64;
  funder: string;
  id: u64;
  installment_count: u32;
  outstanding: i128;
  paid_installments: u32;
  status: InvoiceStatus;
  supplier: string;
  updated_at: u64;
  warung: string;
}


export interface Reputation {
  default_count: u32;
  late_payment: u32;
  paid_on_time: u32;
  score: u32;
  total_invoice: u32;
  warung: string;
}

export enum InvoiceStatus {
  Requested = 0,
  Approved = 1,
  Funded = 2,
  Shipped = 3,
  Delivered = 4,
  Released = 5,
  Repaying = 6,
  Paid = 7,
  Disputed = 8,
  Cancelled = 9,
  Defaulted = 10,
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, asset}: {admin: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_invoice: ({invoice_id}: {invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Invoice>>

  /**
   * Construct and simulate a fund_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fund_invoice: ({invoice_id, funder}: {invoice_id: u64, funder: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mark_shipped transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mark_shipped: ({invoice_id}: {invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a open_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  open_dispute: ({invoice_id}: {invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_invoice: ({warung, supplier, amount, installment_count, due_timestamp}: {warung: string, supplier: string, amount: i128, installment_count: u32, due_timestamp: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_reputation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_reputation: ({warung}: {warung: string}, options?: MethodOptions) => Promise<AssembledTransaction<Reputation>>

  /**
   * Construct and simulate a approve_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve_invoice: ({invoice_id}: {invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a pay_installment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pay_installment: ({invoice_id, payer, amount}: {invoice_id: u64, payer: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve_dispute: ({invoice_id, release_to_supplier}: {invoice_id: u64, release_to_supplier: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a confirm_delivery transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  confirm_delivery: ({invoice_id}: {invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a release_to_supplier transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release_to_supplier: ({invoice_id}: {invoice_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAFQXNzZXQAAAAAAAAAAAAAAAAAAA5JbnZvaWNlQ291bnRlcgAAAAAAAQAAAAAAAAAHSW52b2ljZQAAAAABAAAABgAAAAEAAAAAAAAAClJlcHV0YXRpb24AAAAAAAEAAAAT",
        "AAAAAQAAAAAAAAAAAAAAB0ludm9pY2UAAAAADQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAADWR1ZV90aW1lc3RhbXAAAAAAAAAGAAAAAAAAAAZmdW5kZXIAAAAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAAAAABFpbnN0YWxsbWVudF9jb3VudAAAAAAAAAQAAAAAAAAAC291dHN0YW5kaW5nAAAAAAsAAAAAAAAAEXBhaWRfaW5zdGFsbG1lbnRzAAAAAAAABAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADUludm9pY2VTdGF0dXMAAAAAAAAAAAAACHN1cHBsaWVyAAAAEwAAAAAAAAAKdXBkYXRlZF9hdAAAAAAABgAAAAAAAAAGd2FydW5nAAAAAAAT",
        "AAAAAQAAAAAAAAAAAAAAClJlcHV0YXRpb24AAAAAAAYAAAAAAAAADWRlZmF1bHRfY291bnQAAAAAAAAEAAAAAAAAAAxsYXRlX3BheW1lbnQAAAAEAAAAAAAAAAxwYWlkX29uX3RpbWUAAAAEAAAAAAAAAAVzY29yZQAAAAAAAAQAAAAAAAAADXRvdGFsX2ludm9pY2UAAAAAAAAEAAAAAAAAAAZ3YXJ1bmcAAAAAABM=",
        "AAAAAwAAAAAAAAAAAAAADUludm9pY2VTdGF0dXMAAAAAAAALAAAAAAAAAAlSZXF1ZXN0ZWQAAAAAAAAAAAAAAAAAAAhBcHByb3ZlZAAAAAEAAAAAAAAABkZ1bmRlZAAAAAAAAgAAAAAAAAAHU2hpcHBlZAAAAAADAAAAAAAAAAlEZWxpdmVyZWQAAAAAAAAEAAAAAAAAAAhSZWxlYXNlZAAAAAUAAAAAAAAACFJlcGF5aW5nAAAABgAAAAAAAAAEUGFpZAAAAAcAAAAAAAAACERpc3B1dGVkAAAACAAAAAAAAAAJQ2FuY2VsbGVkAAAAAAAACQAAAAAAAAAJRGVmYXVsdGVkAAAAAAAACg==",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAVhc3NldAAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAALZ2V0X2ludm9pY2UAAAAAAQAAAAAAAAAKaW52b2ljZV9pZAAAAAAABgAAAAEAAAfQAAAAB0ludm9pY2UA",
        "AAAAAAAAAAAAAAAMZnVuZF9pbnZvaWNlAAAAAgAAAAAAAAAKaW52b2ljZV9pZAAAAAAABgAAAAAAAAAGZnVuZGVyAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAMbWFya19zaGlwcGVkAAAAAQAAAAAAAAAKaW52b2ljZV9pZAAAAAAABgAAAAA=",
        "AAAAAAAAAAAAAAAMb3Blbl9kaXNwdXRlAAAAAQAAAAAAAAAKaW52b2ljZV9pZAAAAAAABgAAAAA=",
        "AAAAAAAAAAAAAAAOY3JlYXRlX2ludm9pY2UAAAAAAAUAAAAAAAAABndhcnVuZwAAAAAAEwAAAAAAAAAIc3VwcGxpZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWluc3RhbGxtZW50X2NvdW50AAAAAAAABAAAAAAAAAANZHVlX3RpbWVzdGFtcAAAAAAAAAYAAAABAAAABg==",
        "AAAAAAAAAAAAAAAOZ2V0X3JlcHV0YXRpb24AAAAAAAEAAAAAAAAABndhcnVuZwAAAAAAEwAAAAEAAAfQAAAAClJlcHV0YXRpb24AAA==",
        "AAAAAAAAAAAAAAAPYXBwcm92ZV9pbnZvaWNlAAAAAAEAAAAAAAAACmludm9pY2VfaWQAAAAAAAYAAAAA",
        "AAAAAAAAAAAAAAAPcGF5X2luc3RhbGxtZW50AAAAAAMAAAAAAAAACmludm9pY2VfaWQAAAAAAAYAAAAAAAAABXBheWVyAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAAPcmVzb2x2ZV9kaXNwdXRlAAAAAAIAAAAAAAAACmludm9pY2VfaWQAAAAAAAYAAAAAAAAAE3JlbGVhc2VfdG9fc3VwcGxpZXIAAAAAAQAAAAA=",
        "AAAAAAAAAAAAAAAQY29uZmlybV9kZWxpdmVyeQAAAAEAAAAAAAAACmludm9pY2VfaWQAAAAAAAYAAAAA",
        "AAAAAAAAAAAAAAATcmVsZWFzZV90b19zdXBwbGllcgAAAAABAAAAAAAAAAppbnZvaWNlX2lkAAAAAAAGAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        get_invoice: this.txFromJSON<Invoice>,
        fund_invoice: this.txFromJSON<null>,
        mark_shipped: this.txFromJSON<null>,
        open_dispute: this.txFromJSON<null>,
        create_invoice: this.txFromJSON<u64>,
        get_reputation: this.txFromJSON<Reputation>,
        approve_invoice: this.txFromJSON<null>,
        pay_installment: this.txFromJSON<null>,
        resolve_dispute: this.txFromJSON<null>,
        confirm_delivery: this.txFromJSON<null>,
        release_to_supplier: this.txFromJSON<null>
  }
}
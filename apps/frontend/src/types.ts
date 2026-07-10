/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RoleCode {
  WARUNG = "WARUNG",
  SUPPLIER = "SUPPLIER",
  KOPERASI = "KOPERASI",
  INVESTOR = "INVESTOR",
  ADMIN = "ADMIN"
}

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type KYCStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEED_REVISION";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type GeneralStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  party_id: string;
  role_code: RoleCode;
  email: string;
  phone_number: string;
  password_hash: string;
  status: UserStatus;
  last_login_at: string;
}

export interface Party {
  id: string;
  party_type: RoleCode;
  legal_name: string;
  display_name: string;
  kyc_status: KYCStatus;
  risk_level: RiskLevel;
  status: GeneralStatus;
  avatar_url?: string;
  ktp_number_encrypted?: string; // Encrypted representation for advanced security demo
}

export interface WarungProfile {
  party_id: string;
  owner_name: string;
  address: string;
  city: string;
  province: string;
  monthly_turnover_estimate: number;
  trust_score: number;
  limit_amount: number;
  available_limit: number;
}

export interface SupplierProfile {
  party_id: string;
  business_name: string;
  service_area: string;
  settlement_bank_code: string;
  settlement_account_no_encrypted: string; // Advanced encryption visualization
  auto_cashout_enabled: boolean;
  supplier_fee_rate: number; // legacy profile field; active fee calculation uses fixed cost tiers
}

export interface Product {
  id: string;
  supplier_id: string;
  category: "Sembako" | "Minuman" | "Rumah Tangga";
  name: string;
  unit: string; // e.g. "kg", "karton", "pcs"
  unit_price: number;
  minimum_order_qty: number;
  stock_qty?: number;
  stock_status: "AVAILABLE" | "LIMITED" | "OUT_OF_STOCK";
  is_active: boolean;
  image_url?: string;
  image_urls?: string[];
  description?: string;
}

export type InvoiceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "SUPPLIER_APPROVED"
  | "COOP_REVIEW"
  | "FUNDED"
  | "ESCROW_LOCKED"
  | "SHIPPED"
  | "RECEIVED_CONFIRMED"
  | "PAYOUT_PROCESSING"
  | "REPAYMENT_ACTIVE"
  | "COMPLETED"
  | "OVERDUE"
  | "DISPUTE"
  | "REJECTED";

export interface Invoice {
  id: string;
  invoice_no: string;
  warung_id: string;
  supplier_id: string;
  cooperative_id: string;
  total_amount: number;
  down_payment_amount: number;
  funding_amount: number; // total_amount - down_payment_amount
  warung_fee_amount: number; // e.g. 2-3% platform/admin fee
  repayment_type?: "INSTALLMENT" | "BALLOON";
  installment_count?: 1 | 2 | 3;
  dp_paid_at?: string;
  due_date: string;
  tenor_days: number;
  status: InvoiceStatus;
  row_version: number;
  shipping_proof_url?: string;
  shipping_resi?: string;
  dispute_reason?: string;
  dispute_proof_url?: string;
  dispute_proof_urls?: string[];
  dispute_solution?: string;
  rejection_reason?: string;
  receipt_note?: string;
  receipt_proof_urls?: string[];
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name_snapshot: string;
  qty: number;
  unit_price_snapshot: number;
  line_total: number;
}

export interface CooperativePool {
  id: string;
  cooperative_id: string;
  pool_name: string;
  currency_code: string; // "IDR"
  available_amount: number; // Saldo yang bisa didistribusikan ke invoice baru
  locked_amount: number; // Saldo yang sedang dikunci di escrow Soroban
  total_repaid_amount: number; // Total repayment received
  total_return_generated: number; // Interest/return generated for pool
  status: "ACTIVE" | "CLOSED";
}

export interface PoolContribution {
  id: string;
  pool_id: string;
  investor_id: string;
  amount: number;
  status: "PENDING" | "SETTLED" | "WITHDRAWN";
  topup_reference: string;
  created_at: string;
}

export interface FundingAllocation {
  id: string;
  invoice_id: string;
  pool_id: string;
  allocated_amount: number;
  status: "LOCKED" | "RELEASED" | "REFUNDED";
  locked_at: string;
  released_at?: string;
}

export interface RepaymentSchedule {
  id: string;
  invoice_id: string;
  sequence_no: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
}

export interface Payout {
  id: string;
  invoice_id: string;
  supplier_id: string;
  gross_amount: number;
  supplier_fee_amount: number;
  net_amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REVERSED";
  partner_reference: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  party_id: string;
  amount: number;
  fee_amount: number; // flat Rp2.500 - Rp5.000
  net_amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  idempotency_key: string;
  bank_name: string;
  account_no: string;
  created_at: string;
}

export type AccountType = "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE" | "EQUITY";

export interface LedgerAccount {
  id: string;
  party_id: string | null; // null for general system ledger
  account_no: string;
  account_name: string;
  account_type: AccountType;
  currency_code: string; // "IDR"
  normal_balance: "DEBIT" | "CREDIT";
  available_balance: number;
  locked_balance: number;
}

export interface JournalEntry {
  id: string;
  entry_no: string;
  entry_type: "TOPUP" | "LOCK" | "RELEASE" | "PAYOUT" | "REPAYMENT" | "WITHDRAWAL" | "FEE";
  reference_type: "INVOICE" | "PAYOUT" | "REPAYMENT" | "POOL_CONTRIBUTION" | "WITHDRAWAL";
  reference_id: string;
  status: "DRAFT" | "POSTED" | "REVERSED";
  posted_at: string;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  ledger_account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

export interface StellarTransaction {
  id: string;
  business_reference_type: "INVOICE" | "PAYOUT" | "REPAYMENT" | "TOPUP" | "WITHDRAWAL";
  business_reference_id: string;
  network: "TESTNET" | "MAINNET";
  tx_hash: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "PENDING_RETRY";
  ledger_sequence: number;
  submitted_at: string;
  operation?: "LOCK_FUNDING" | "RELEASE_ESCROW" | "REFUND_ESCROW" | "POST_REPAYMENT" | "TOPUP_POOL" | "WITHDRAW" | "SIMULATED_EVENT";
  contract_id?: string;
  explorer_url?: string;
  idempotency_key?: string;
  is_live?: boolean;
}

export interface SorobanContractEvent {
  id: string;
  stellar_transaction_id: string;
  contract_id: string;
  event_name: "FundLocked" | "InvoiceReleased" | "PayoutRequested" | "RepaymentPosted" | "InvoiceCompleted" | "DisputeRaised";
  business_reference_type: "INVOICE" | "PAYOUT" | "REPAYMENT" | "TOPUP" | "WITHDRAWAL";
  business_reference_id: string;
  payload_json: string;
  ledger_sequence: number;
  emitted_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json?: string;
  after_json?: string;
  ip_address: string;
  timestamp: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

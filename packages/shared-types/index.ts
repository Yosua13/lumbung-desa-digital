export type UserRole = 'warung' | 'supplier' | 'funder' | 'admin';

export interface User {
  id: number;
  wallet_address: string;
  role: UserRole;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Warung {
  id: number;
  user_id: number;
  warung_name: string;
  owner_name: string;
  city: string;
  credit_limit: number;
  available_limit: number;
  reputation_score: number;
  status: 'active' | 'inactive';
}

export interface Supplier {
  id: number;
  user_id: number;
  company_name: string;
  city: string;
  status: 'active' | 'inactive';
}

export interface Product {
  id: number;
  supplier_id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  min_order: number;
  stock: number;
  image_url: string;
  is_active: boolean;
}

export type CreditRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';

export interface CreditRequest {
  id: number;
  warung_id: number;
  supplier_id: number;
  total_amount: number;
  status: CreditRequestStatus;
  requested_at: string;
  approved_at: string | null;
  warung_name?: string;
  reputation_score?: number;
}

export interface CreditRequestItem {
  id: number;
  credit_request_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
}

export type InvoiceStatus =
  | 'Requested'
  | 'Approved'
  | 'Funded'
  | 'Shipped'
  | 'Delivered'
  | 'Released'
  | 'Repaying'
  | 'Paid'
  | 'Disputed'
  | 'Cancelled'
  | 'Defaulted';

export interface Invoice {
  id: number;
  contract_invoice_id: number;
  credit_request_id: number;
  warung_id: number;
  supplier_id: number;
  funder_wallet: string | null;
  asset_contract: string;
  total_amount: number;
  outstanding_amount: number;
  installment_count: number;
  paid_installments: number;
  status: InvoiceStatus;
  due_date: string;
  tx_hash_create: string | null;
  tx_hash_fund: string | null;
  tx_hash_release: string | null;
  warung_name?: string;
  supplier_name?: string;
  warung_wallet?: string;
  supplier_wallet?: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  name?: string;
}

export type RepaymentStatus = 'UNPAID' | 'PAID' | 'OVERDUE';

export interface Repayment {
  id: number;
  invoice_id: number;
  installment_no: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: RepaymentStatus;
  tx_hash: string | null;
}

export interface ReputationScore {
  id: number;
  warung_id: number;
  score: number;
  total_invoice: number;
  paid_on_time: number;
  late_payment: number;
  default_count: number;
  updated_at: string;
}

export interface ContractEvent {
  id: number;
  invoice_id: number;
  event_name: string;
  tx_hash: string;
  ledger: number;
  payload_json: string;
  created_at: string;
}

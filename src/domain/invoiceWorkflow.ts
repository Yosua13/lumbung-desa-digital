import { InvoiceStatus } from "../types";

export const INVOICE_STATUS_SEQUENCE: InvoiceStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "SUPPLIER_APPROVED",
  "COOP_REVIEW",
  "ESCROW_LOCKED",
  "SHIPPED",
  "RECEIVED_CONFIRMED",
  "PAYOUT_PROCESSING",
  "REPAYMENT_ACTIVE",
  "COMPLETED",
];

const TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["SUBMITTED", "REJECTED"],
  SUBMITTED: ["SUPPLIER_APPROVED", "REJECTED", "DISPUTE"],
  SUPPLIER_APPROVED: ["COOP_REVIEW", "ESCROW_LOCKED", "REJECTED", "DISPUTE"],
  COOP_REVIEW: ["ESCROW_LOCKED", "REJECTED", "DISPUTE"],
  FUNDED: ["ESCROW_LOCKED", "DISPUTE"],
  ESCROW_LOCKED: ["SHIPPED", "DISPUTE", "REJECTED"],
  SHIPPED: ["RECEIVED_CONFIRMED", "DISPUTE"],
  RECEIVED_CONFIRMED: ["PAYOUT_PROCESSING", "DISPUTE"],
  PAYOUT_PROCESSING: ["REPAYMENT_ACTIVE", "DISPUTE"],
  REPAYMENT_ACTIVE: ["COMPLETED", "OVERDUE", "DISPUTE"],
  COMPLETED: [],
  OVERDUE: ["REPAYMENT_ACTIVE", "COMPLETED", "DISPUTE"],
  DISPUTE: ["PAYOUT_PROCESSING", "REJECTED"],
  REJECTED: [],
};

export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return TRANSITIONS[from]?.includes(to) || false;
}

export function requireInvoiceTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (!canTransitionInvoice(from, to)) {
    throw new Error(`Transisi invoice tidak valid: ${from} -> ${to}`);
  }
}

export function getInvoiceProgressIndex(status: InvoiceStatus): number {
  const idx = INVOICE_STATUS_SEQUENCE.indexOf(status);
  return idx === -1 ? 0 : idx;
}

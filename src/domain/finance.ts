import { CartItem, RepaymentSchedule } from "../types";
import { generateId } from "../utils";

export interface InvoiceQuote {
  totalAmount: number;
  downPaymentAmount: number;
  fundingAmount: number;
  warungFeeAmount: number;
  estimatedRepaymentAmount: number;
}

export function calculateInvoiceQuote(items: CartItem[], downPaymentAmount: number, warungFeeRate = 0.03): InvoiceQuote {
  const totalAmount = items.reduce((sum, item) => sum + item.product.unit_price * item.qty, 0);
  const safeDownPayment = Math.max(0, Math.min(downPaymentAmount, totalAmount));
  const fundingAmount = Math.max(0, totalAmount - safeDownPayment);
  const warungFeeAmount = Math.round(fundingAmount * warungFeeRate);

  return {
    totalAmount,
    downPaymentAmount: safeDownPayment,
    fundingAmount,
    warungFeeAmount,
    estimatedRepaymentAmount: fundingAmount + warungFeeAmount,
  };
}

export function createFlexibleRepaymentSchedules(
  invoiceId: string,
  totalDue: number,
  tenorDays: number,
  installmentCount = 3,
): RepaymentSchedule[] {
  const count = Math.max(1, installmentCount);
  const baseAmount = Math.floor(totalDue / count);
  const remainder = totalDue - baseAmount * count;
  const stepDays = Math.max(1, Math.floor(tenorDays / count));

  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 1;
    const amountDue = baseAmount + (sequence === count ? remainder : 0);
    const dueDate = new Date(Date.now() + stepDays * sequence * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10);

    return {
      id: generateId("SCHED"),
      invoice_id: invoiceId,
      sequence_no: sequence,
      due_date: dueDate,
      amount_due: amountDue,
      amount_paid: 0,
      status: "PENDING",
    };
  });
}

export function calculateSupplierFee(grossAmount: number, supplierFeeRate: number): number {
  return Math.round(grossAmount * supplierFeeRate);
}

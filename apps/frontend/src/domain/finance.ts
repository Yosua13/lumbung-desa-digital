import { CartItem, RepaymentSchedule } from "../types";
import { generateId } from "../utils";

export interface InvoiceQuote {
  totalAmount: number;
  downPaymentAmount: number;
  fundingAmount: number;
  warungFeeAmount: number;
  warungFeeLabel: string;
  estimatedRepaymentAmount: number;
}

export interface FeeTier {
  maxAmount: number;
  fee: number;
  label: string;
}

export const WARUNG_ADMIN_FEE_TIERS: FeeTier[] = [
  { maxAmount: 1_000_000, fee: 5_000, label: "<= Rp1 juta" },
  { maxAmount: 3_000_000, fee: 10_000, label: "> Rp1 juta - Rp3 juta" },
  { maxAmount: 5_000_000, fee: 20_000, label: "> Rp3 juta - Rp5 juta" },
  { maxAmount: 10_000_000, fee: 35_000, label: "> Rp5 juta - Rp10 juta" },
  { maxAmount: 25_000_000, fee: 75_000, label: "> Rp10 juta - Rp25 juta" },
  { maxAmount: 50_000_000, fee: 125_000, label: "> Rp25 juta - Rp50 juta" },
  { maxAmount: 100_000_000, fee: 200_000, label: "> Rp50 juta - Rp100 juta" },
];

export const SUPPLIER_SUCCESS_FEE_TIERS: FeeTier[] = [
  { maxAmount: 1_000_000, fee: 10_000, label: "<= Rp1 juta" },
  { maxAmount: 3_000_000, fee: 15_000, label: "> Rp1 juta - Rp3 juta" },
  { maxAmount: 5_000_000, fee: 25_000, label: "> Rp3 juta - Rp5 juta" },
  { maxAmount: 10_000_000, fee: 40_000, label: "> Rp5 juta - Rp10 juta" },
  { maxAmount: 25_000_000, fee: 75_000, label: "> Rp10 juta - Rp25 juta" },
  { maxAmount: 50_000_000, fee: 125_000, label: "> Rp25 juta - Rp50 juta" },
  { maxAmount: 100_000_000, fee: 200_000, label: "> Rp50 juta - Rp100 juta" },
];

export function calculateTieredFee(amount: number, tiers: FeeTier[], fallbackRate = 0.002, fallbackCap = 500_000) {
  const safeAmount = Math.max(0, amount);
  const tier = tiers.find(item => safeAmount <= item.maxAmount);
  if (tier) {
    return { amount: tier.fee, label: tier.label };
  }

  return {
    amount: Math.min(Math.round(safeAmount * fallbackRate), fallbackCap),
    label: "> Rp100 juta",
  };
}

export function calculateWarungAdminFee(fundingAmount: number) {
  return calculateTieredFee(fundingAmount, WARUNG_ADMIN_FEE_TIERS);
}

export function calculateSupplierSuccessFee(totalPurchaseAmount: number) {
  return calculateTieredFee(totalPurchaseAmount, SUPPLIER_SUCCESS_FEE_TIERS);
}

export function calculateInvoiceQuote(items: CartItem[], downPaymentAmount: number): InvoiceQuote {
  const totalAmount = items.reduce((sum, item) => sum + item.product.unit_price * item.qty, 0);
  const safeDownPayment = Math.max(0, Math.min(downPaymentAmount, totalAmount));
  const fundingAmount = Math.max(0, totalAmount - safeDownPayment);
  const warungFee = calculateWarungAdminFee(fundingAmount);

  return {
    totalAmount,
    downPaymentAmount: safeDownPayment,
    fundingAmount,
    warungFeeAmount: warungFee.amount,
    warungFeeLabel: warungFee.label,
    estimatedRepaymentAmount: fundingAmount + warungFee.amount,
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

export function calculateSupplierFee(totalPurchaseAmount: number): number {
  return calculateSupplierSuccessFee(totalPurchaseAmount).amount;
}

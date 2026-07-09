export interface JournalLineDraft {
  ledgerAccountNo: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalDraft {
  entryType: string;
  referenceType: string;
  referenceId: string;
  lines: JournalLineDraft[];
}

export function validateBalancedJournal(journal: JournalDraft): void {
  const totalDebit = journal.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = journal.lines.reduce((sum, line) => sum + line.credit, 0);

  if (totalDebit <= 0 || totalCredit <= 0) {
    throw new Error(`Journal ${journal.entryType} harus memiliki debit dan credit.`);
  }

  if (Math.round(totalDebit) !== Math.round(totalCredit)) {
    throw new Error(
      `Journal ${journal.entryType} tidak balance untuk ${journal.referenceType}:${journal.referenceId}. Debit ${totalDebit}, credit ${totalCredit}.`,
    );
  }
}

export function createLockFundingJournal(referenceId: string, fundingAmount: number): JournalDraft {
  return {
    entryType: "LOCK",
    referenceType: "INVOICE",
    referenceId,
    lines: [
      {
        ledgerAccountNo: "10100_LOCKED",
        debit: fundingAmount,
        credit: 0,
        description: "Dana pool dikunci untuk invoice supplier.",
      },
      {
        ledgerAccountNo: "10100",
        debit: 0,
        credit: fundingAmount,
        description: "Saldo tersedia pool berkurang karena escrow lock.",
      },
    ],
  };
}

export function createRepaymentJournal(referenceId: string, amountDue: number): JournalDraft {
  return {
    entryType: "REPAYMENT",
    referenceType: "REPAYMENT",
    referenceId,
    lines: [
      {
        ledgerAccountNo: "10100",
        debit: amountDue,
        credit: 0,
        description: "Kas platform bertambah dari cicilan warung.",
      },
      {
        ledgerAccountNo: "12100",
        debit: 0,
        credit: amountDue,
        description: "Piutang pembiayaan berkurang setelah cicilan.",
      },
    ],
  };
}

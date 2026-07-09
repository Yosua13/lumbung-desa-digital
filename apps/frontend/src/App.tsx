/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useState, useEffect } from "react";
import { RoleCode, Party, WarungProfile, SupplierProfile, Product, Invoice, InvoiceItem, CooperativePool, PoolContribution, RepaymentSchedule, Payout, LedgerAccount, StellarTransaction, AuditLog, CartItem } from "./types";
import {
  initialParties,
  initialWarungProfiles,
  initialSupplierProfiles,
  initialProducts,
  initialPools,
  initialContributions,
  initialInvoices,
  initialInvoiceItems,
  initialRepaymentSchedules,
  initialLedgerAccounts,
  initialStellarTransactions,
  initialAuditLogs
} from "./data";
import { generateId } from "./utils";
import { Landmark } from "lucide-react";
import { calculateInvoiceQuote, calculateSupplierFee, createFlexibleRepaymentSchedules } from "./domain/finance";
import { createLockFundingJournal, createRepaymentJournal, validateBalancedJournal } from "./domain/ledger";
import { requireInvoiceTransition } from "./domain/invoiceWorkflow";
import { useStellarWallet } from "./hooks/useStellarWallet";
import { createStellarTransactionRecord, StellarTransactionInput } from "./web3/stellar";

import WalletConnectionBar from "./components/WalletConnectionBar";

const RoleSelector = lazy(() => import("./pages/RoleSelector"));
const WarungDashboard = lazy(() => import("./features/warung/WarungDashboard"));
const SupplierDashboard = lazy(() => import("./features/supplier/SupplierDashboard"));
const KoperasiDashboard = lazy(() => import("./features/koperasi/KoperasiDashboard"));
const InvestorDashboard = lazy(() => import("./features/investor/InvestorDashboard"));
const AdminDashboard = lazy(() => import("./features/admin/AdminDashboard"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Sidebar = lazy(() => import("./layouts/Sidebar"));

function AppLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080A] text-[#E0E0E0]">
      <div className="rounded-xl border border-[#1F2127] bg-[#0F1115] px-5 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
        Memuat WSC Platform...
      </div>
    </div>
  );
}

export default function App() {
  const stellarWallet = useStellarWallet();

  // Authentication & Role Status
  const [showLanding, setShowLanding] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleCode>(RoleCode.WARUNG);
  const [activeTab, setActiveTab] = useState<string>("profil");
  const [userEmail] = useState("reyyosua29@gmail.com");

  // Dynamic system states (seeded with realistic preloaded data)
  const [parties, setParties] = useState<Party[]>(initialParties);
  const [warungProfiles, setWarungProfiles] = useState<WarungProfile[]>(initialWarungProfiles);
  const [supplierProfiles, setSupplierProfiles] = useState<SupplierProfile[]>(initialSupplierProfiles);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [pool, setPool] = useState<CooperativePool>(initialPools[0]);
  const [contributions, setContributions] = useState<PoolContribution[]>(initialContributions);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(initialInvoiceItems);
  const [repaymentSchedules, setRepaymentSchedules] = useState<RepaymentSchedule[]>(initialRepaymentSchedules);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>(initialLedgerAccounts);
  const [stellarTransactions, setStellarTransactions] = useState<StellarTransaction[]>(initialStellarTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Wallets representing liquid accessible balances for each active party
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({
    "party-warung-01": 500000,
    "party-warung-02": 250000,
    "party-warung-03": 1200000,
    "party-warung-04": 150000,
    "party-warung-05": 0,
    "party-warung-06": 400000,
    "party-warung-07": 0,
    "party-warung-08": 600000,
    "party-warung-09": 100000,
    "party-warung-10": 850000,
    "party-supplier-01": 15000000,
    "party-supplier-02": 8000000,
    "party-supplier-03": 12000000,
    "party-investor-01": 2450000, // Rey Yosua yield wallet
    "party-investor-02": 980000,
    "party-investor-03": 490000,
    "party-coop-01": 5000000,
    "party-admin-01": 15000000
  });

  // Advanced Encryption - Security States
  const [kmsKeyId, setKmsKeyId] = useState<string>("kms-key-v1-active");
  const [isRotatingKey, setIsRotatingKey] = useState<boolean>(false);

  // Active party selection based on the role
  const [activePartyId, setActivePartyId] = useState<string>("party-warung-01");

  // Sync activePartyId and activeTab when role changes
  useEffect(() => {
    if (currentRole === RoleCode.WARUNG) {
      setActivePartyId("party-warung-01");
      setActiveTab("profil");
    } else if (currentRole === RoleCode.SUPPLIER) {
      setActivePartyId("party-supplier-01");
      setActiveTab("dashboard");
    } else if (currentRole === RoleCode.KOPERASI) {
      setActivePartyId("party-coop-01");
      setActiveTab("dashboard");
    } else if (currentRole === RoleCode.INVESTOR) {
      setActivePartyId("party-investor-01");
      setActiveTab("portfolio");
    } else if (currentRole === RoleCode.ADMIN) {
      setActivePartyId("party-admin-01");
      setActiveTab("metrics");
    }
  }, [currentRole]);

  const activeParty = parties.find(p => p.id === activePartyId) || null;
  const activeWarungProfile = warungProfiles.find(w => w.party_id === activePartyId) || warungProfiles[0];
  const activeSupplierProfile = supplierProfiles.find(s => s.party_id === activePartyId) || supplierProfiles[0];

  // Helper to post standard Audit Log
  const postAuditLog = (action: string, entityType: string, entityId: string, before: any, after: any) => {
    const log: AuditLog = {
      id: generateId("AUDIT"),
      actor_user_id: activePartyId,
      actor_name: activeParty?.display_name || "System",
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_json: JSON.stringify(before),
      after_json: JSON.stringify(after),
      ip_address: "182.253.14.88",
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Helper to post a Stellar/Soroban transaction record.
  // In demo mode this creates a deterministic-looking testnet record; live mode can replace it with a signed Freighter result.
  const postStellarTx = (
    refType: "INVOICE" | "PAYOUT" | "REPAYMENT" | "TOPUP" | "WITHDRAWAL",
    refId: string,
    operation: StellarTransactionInput["operation"] = "SIMULATED_EVENT"
  ): string => {
    const tx = createStellarTransactionRecord({
      referenceType: refType,
      referenceId: refId,
      operation,
      idempotencyKey: `${refType}:${refId}:${operation}`
    });

    setStellarTransactions(prev => [tx, ...prev]);
    return tx.tx_hash;
  };

  // 1. ACTION: Create a draft invoice from Warung cart
  const handleCreateInvoice = (supplierId: string, items: CartItem[], dp: number, tenor: number) => {
    const quote = calculateInvoiceQuote(items, dp);

    if (items.length === 0 || quote.totalAmount <= 0) {
      alert("Keranjang belum valid untuk diajukan sebagai invoice.");
      return;
    }

    if (quote.fundingAmount <= 0) {
      alert("Nilai pembiayaan harus lebih besar dari nol setelah DP.");
      return;
    }

    const newInvoice: Invoice = {
      id: generateId("INV"),
      invoice_no: `WSC-20260707-${Math.floor(10 + Math.random() * 89)}`,
      warung_id: activePartyId,
      supplier_id: supplierId,
      cooperative_id: "party-coop-01",
      total_amount: quote.totalAmount,
      down_payment_amount: quote.downPaymentAmount,
      funding_amount: quote.fundingAmount,
      warung_fee_amount: quote.warungFeeAmount,
      due_date: new Date(Date.now() + tenor * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      tenor_days: tenor,
      status: "DRAFT",
      row_version: 1,
      created_at: new Date().toISOString()
    };

    // Create Invoice items snapshots
    const newItems: InvoiceItem[] = items.map(item => ({
      id: generateId("ITEM"),
      invoice_id: newInvoice.id,
      product_id: item.product.id,
      product_name_snapshot: item.product.name,
      qty: item.qty,
      unit_price_snapshot: item.product.unit_price,
      line_total: item.product.unit_price * item.qty
    }));

    // Update states
    setInvoices(prev => [newInvoice, ...prev]);
    setInvoiceItems(prev => [...newItems, ...prev]);

    // Logs
    postAuditLog("CREATE_DRAFT_INVOICE", "INVOICE", newInvoice.id, {}, newInvoice);
    postStellarTx("INVOICE", newInvoice.id, "SIMULATED_EVENT");
  };

  const handleUpdateDraftInvoice = (invoiceId: string, supplierId: string, items: CartItem[], dp: number, tenor: number) => {
    const quote = calculateInvoiceQuote(items, dp);

    if (items.length === 0 || quote.totalAmount <= 0 || quote.fundingAmount <= 0) {
      alert("Draft belum valid untuk diperbarui.");
      return;
    }

    const currentInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!currentInvoice || currentInvoice.status !== "DRAFT") {
      alert("Hanya invoice berstatus belum diajukan yang dapat diedit.");
      return;
    }

    const updatedItems: InvoiceItem[] = items.map(item => ({
      id: generateId("ITEM"),
      invoice_id: invoiceId,
      product_id: item.product.id,
      product_name_snapshot: item.product.name,
      qty: item.qty,
      unit_price_snapshot: item.product.unit_price,
      line_total: item.product.unit_price * item.qty
    }));

    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const updated: Invoice = {
        ...inv,
        supplier_id: supplierId,
        total_amount: quote.totalAmount,
        down_payment_amount: quote.downPaymentAmount,
        funding_amount: quote.fundingAmount,
        warung_fee_amount: quote.warungFeeAmount,
        due_date: new Date(Date.now() + tenor * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        tenor_days: tenor,
        rejection_reason: undefined,
        row_version: inv.row_version + 1
      };
      postAuditLog("UPDATE_DRAFT_INVOICE", "INVOICE", invoiceId, inv, updated);
      return updated;
    }));
    setInvoiceItems(prev => [...updatedItems, ...prev.filter(item => item.invoice_id !== invoiceId)]);
  };

  const handleSubmitDraftInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      if (inv.status !== "DRAFT") {
        alert("Hanya draft yang bisa diajukan.");
        return inv;
      }
      if (inv.funding_amount > activeWarungProfile.available_limit) {
        alert("Nilai pembiayaan melebihi limit tersedia warung.");
        return inv;
      }

      const updated = { ...inv, status: "SUBMITTED" as const, row_version: inv.row_version + 1 };

      setWarungProfiles(prevProfiles => prevProfiles.map(p => {
        if (p.party_id === inv.warung_id) {
          return { ...p, available_limit: Math.max(0, p.available_limit - inv.funding_amount) };
        }
        return p;
      }));

      setLedgerAccounts(prevLedgers => prevLedgers.map(acc => {
        if (acc.account_no === "12100") {
          return { ...acc, available_balance: acc.available_balance + inv.funding_amount };
        }
        return acc;
      }));

      postAuditLog("SUBMIT_INVOICE_FINANCING", "INVOICE", invoiceId, inv, updated);
      return updated;
    }));
  };

  // 2. ACTION: Supplier approves the invoice
  const handleApproveInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        requireInvoiceTransition(inv.status, "SUPPLIER_APPROVED");
        const updated = { ...inv, status: "SUPPLIER_APPROVED" as const, row_version: inv.row_version + 1 };
        postAuditLog("SUPPLIER_APPROVE_ORDER", "INVOICE", invoiceId, inv, updated);
        return updated;
      }
      return inv;
    }));
  };

  // 3. ACTION: Supplier rejects order
  const handleRejectInvoice = (invoiceId: string, reason: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const updated = {
          ...inv,
          status: "DRAFT" as const,
          rejection_reason: reason,
          row_version: inv.row_version + 1
        };
        postAuditLog("SUPPLIER_REJECT_ORDER", "INVOICE", invoiceId, inv, updated);
        
        // Restore credit limit to warung
        setWarungProfiles(prevP => prevP.map(p => {
          if (p.party_id === inv.warung_id) {
            return { ...p, available_limit: p.available_limit + inv.funding_amount };
          }
          return p;
        }));

        // Reduce outstanding receivables
        setLedgerAccounts(prevLed => prevLed.map(acc => {
          if (acc.account_no === "12100") {
            return { ...acc, available_balance: Math.max(0, acc.available_balance - inv.funding_amount) };
          }
          return acc;
        }));

        return updated;
      }
      return inv;
    }));
  };

  const handleDeleteDraftInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || invoice.status !== "DRAFT") {
      alert("Hanya draft pengajuan yang dapat dihapus.");
      return;
    }

    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    setInvoiceItems(prev => prev.filter(item => item.invoice_id !== invoiceId));
    postAuditLog("DELETE_DRAFT_INVOICE", "INVOICE", invoiceId, invoice, {});
  };

  // 4. ACTION: Koperasi approves risk and locks funding pool
  const handleApproveFunding = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        if (!["SUPPLIER_APPROVED", "COOP_REVIEW"].includes(inv.status)) {
          alert("Invoice belum siap didanai. Supplier harus menyetujui pesanan terlebih dahulu.");
          return inv;
        }

        if (pool.available_amount < inv.funding_amount) {
          alert("Saldo pool koperasi tidak cukup untuk mengunci dana invoice ini.");
          return inv;
        }

        validateBalancedJournal(createLockFundingJournal(invoiceId, inv.funding_amount));
        const updated = { ...inv, status: "ESCROW_LOCKED" as const, row_version: inv.row_version + 1 };
        
        // Lock Koperasi pool funds
        setPool(prevPool => ({
          ...prevPool,
          available_amount: prevPool.available_amount - inv.funding_amount,
          locked_amount: prevPool.locked_amount + inv.funding_amount
        }));

        // Ledger: debit cash locked asset, credit cash available asset
        setLedgerAccounts(prevAccounts => prevAccounts.map(acc => {
          if (acc.account_no === "10100") { // cash platform
            return {
              ...acc,
              available_balance: acc.available_balance - inv.funding_amount,
              locked_balance: acc.locked_balance + inv.funding_amount
            };
          }
          return acc;
        }));

        postAuditLog("KOPERASI_APPROVE_FUNDING", "INVOICE", invoiceId, inv, updated);
        postStellarTx("INVOICE", invoiceId, "LOCK_FUNDING"); // smart contract "FundLocked" event trigger
        return updated;
      }
      return inv;
    }));
  };

  // 5. ACTION: Koperasi rejects funding review
  const handleRejectFunding = (invoiceId: string, reason = "Koperasi belum dapat menyetujui pembiayaan berdasarkan saldo pool, risiko, DP, atau tenor yang diajukan.") => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const updated = {
          ...inv,
          status: "DRAFT" as const,
          rejection_reason: reason,
          row_version: inv.row_version + 1
        };
        
        // Restore credit limit to warung
        setWarungProfiles(prevP => prevP.map(p => {
          if (p.party_id === inv.warung_id) {
            return { ...p, available_limit: p.available_limit + inv.funding_amount };
          }
          return p;
        }));

        // Reduce outstanding receivables
        setLedgerAccounts(prevLed => prevLed.map(acc => {
          if (acc.account_no === "12100") {
            return { ...acc, available_balance: Math.max(0, acc.available_balance - inv.funding_amount) };
          }
          return acc;
        }));

        postAuditLog("KOPERASI_REJECT_FUNDING", "INVOICE", invoiceId, inv, updated);
        return updated;
      }
      return inv;
    }));
  };

  // 6. ACTION: Supplier marks as Shipped (resi generated)
  const handleSupplierShip = (invoiceId: string, resi: string) => {
    const proofUrl = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80"; // Unsplash delivery truck
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        if (inv.status !== "ESCROW_LOCKED") {
          alert("Supplier hanya dapat mengirim setelah dana invoice terkunci di escrow.");
          return inv;
        }

        const updated = {
          ...inv,
          status: "SHIPPED" as const,
          shipping_resi: resi,
          shipping_proof_url: proofUrl,
          row_version: inv.row_version + 1
        };
        postAuditLog("SUPPLIER_SHIP_GOODS", "INVOICE", invoiceId, inv, updated);
        return updated;
      }
      return inv;
    }));
  };

  // 7. ACTION: Warung confirms receipt (Starts auto-cashout payout)
  const handleConfirmReceipt = (invoiceId: string, note: string, proofUrls: string[]) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        if (inv.status !== "SHIPPED") {
          alert("Barang belum berada pada status yang dapat dikonfirmasi diterima.");
          return inv;
        }

        const updated = {
          ...inv,
          status: "RECEIVED_CONFIRMED" as const,
          receipt_note: note,
          receipt_proof_urls: proofUrls,
          row_version: inv.row_version + 1
        };
        
        postAuditLog("WARUNG_CONFIRM_RECEIPT", "INVOICE", invoiceId, inv, updated);
        
        setTimeout(() => {
          setInvoices(currentInvoices => currentInvoices.map(currentInv => {
            if (currentInv.id === invoiceId && currentInv.status === "RECEIVED_CONFIRMED") {
              const payoutProcessing = {
                ...currentInv,
                status: "PAYOUT_PROCESSING" as const,
                row_version: currentInv.row_version + 1
              };
              postAuditLog("START_SUPPLIER_AUTO_CASHOUT", "INVOICE", invoiceId, currentInv, payoutProcessing);
              return payoutProcessing;
            }
            return currentInv;
          }));

          setTimeout(() => {
            triggerPayoutWorker(invoiceId, inv.funding_amount, inv.supplier_id);
          }, 900);
        }, 1500);

        return updated;
      }
      return inv;
    }));
  };

  // Logic Background worker payout (auto-cashout Rupiah)
  const triggerPayoutWorker = (invoiceId: string, grossAmount: number, supplierId: string) => {
    const invData = invoices.find(i => i.id === invoiceId);
    const payoutGrossAmount = invData?.total_amount || grossAmount;
    const feeAmount = calculateSupplierFee(payoutGrossAmount);
    const netAmount = payoutGrossAmount - feeAmount;

    const newPayout: Payout = {
      id: generateId("PAY"),
      invoice_id: invoiceId,
      supplier_id: supplierId,
      gross_amount: payoutGrossAmount,
      supplier_fee_amount: feeAmount,
      net_amount: netAmount,
      status: "SUCCESS",
      partner_reference: `WD-BCA-AUTO-${Math.floor(100000 + Math.random() * 899999)}`,
      created_at: new Date().toISOString()
    };

    setPayouts(prev => [newPayout, ...prev]);

    // Release funds from Koperasi locked escrow pool
    setPool(prevPool => ({
      ...prevPool,
      locked_amount: Math.max(0, prevPool.locked_amount - grossAmount)
    }));

    // Update supplier liquid wallet balance (receive cash payout)
    setWalletBalances(prev => ({
      ...prev,
      [supplierId]: (prev[supplierId] || 0) + netAmount
    }));

    // Update general ledgers
    setLedgerAccounts(prevAccounts => prevAccounts.map(acc => {
      if (acc.account_no === "10100") { // Platform Cash
        return {
          ...acc,
          locked_balance: Math.max(0, acc.locked_balance - grossAmount),
          available_balance: acc.available_balance - netAmount
        };
      }
      if (acc.account_no === "40200") { // Success fee revenue account
        return {
          ...acc,
          available_balance: acc.available_balance + feeAmount
        };
      }
      return acc;
    }));

    // Create flexible repayment schedule records for Warung (PRD/SRS).
    const totalFinancing = invData ? invData.funding_amount + invData.warung_fee_amount : grossAmount;
    const schedules = createFlexibleRepaymentSchedules(invoiceId, totalFinancing, invData?.tenor_days || 30);

    setRepaymentSchedules(prev => [...schedules, ...prev]);

    // Move invoice status to REPAYMENT_ACTIVE
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: "REPAYMENT_ACTIVE" as const,
          row_version: inv.row_version + 1
        };
      }
      return inv;
    }));

    // Logs and Stellar ledger transactions
    postAuditLog("SETTLE_PAYOUT_AUTO", "PAYOUT", newPayout.id, {}, newPayout);
    postStellarTx("PAYOUT", newPayout.id, "RELEASE_ESCROW");
  };

  // 8. ACTION: Warung pays an installment
  const handlePayInstallment = (scheduleId: string) => {
    setRepaymentSchedules(prev => prev.map(sch => {
      if (sch.id === scheduleId) {
        if (sch.status === "PAID") return sch;

        validateBalancedJournal(createRepaymentJournal(scheduleId, sch.amount_due));
        const updated = { ...sch, status: "PAID" as const, amount_paid: sch.amount_due };
        
        postAuditLog("PAY_INSTALLMENT", "REPAYMENT_SCHEDULE", scheduleId, sch, updated);
        postStellarTx("REPAYMENT", scheduleId, "POST_REPAYMENT");

        // Update Pool available cash balance (Repayment received)
        setPool(prevPool => ({
          ...prevPool,
          available_amount: prevPool.available_amount + sch.amount_due,
          total_repaid_amount: prevPool.total_repaid_amount + sch.amount_due
        }));

        // Restore Available limit proportion to Warung
        const parentInvoice = invoices.find(inv => inv.id === sch.invoice_id);
        if (parentInvoice) {
          const restorationVal = Math.round(parentInvoice.funding_amount / 3);
          setWarungProfiles(prevProf => prevProf.map(p => {
            if (p.party_id === parentInvoice.warung_id) {
              const newScore = Math.min(100, p.trust_score + 1.2); // Success bonus +1.2 rep score
              return {
                ...p,
                trust_score: newScore,
                available_limit: Math.min(p.limit_amount, p.available_limit + restorationVal)
              };
            }
            return p;
          }));
        }

        // Ledger: debit Cash platform available, credit Receivables, Credit Platform Admin Fee Revenue
        setLedgerAccounts(prevAccounts => prevAccounts.map(acc => {
          if (acc.account_no === "10100") { // Platform Cash available
            return {
              ...acc,
              available_balance: acc.available_balance + sch.amount_due
            };
          }
          if (acc.account_no === "12100" && parentInvoice) { // outstanding receivable asset
            const deductionVal = Math.round(parentInvoice.funding_amount / 3);
            return {
              ...acc,
              available_balance: Math.max(0, acc.available_balance - deductionVal)
            };
          }
          if (acc.account_no === "40100" && parentInvoice) { // platform admin fee revenue
            const portionFee = Math.round(parentInvoice.warung_fee_amount / 3);
            return {
              ...acc,
              available_balance: acc.available_balance + portionFee
            };
          }
          return acc;
        }));

        // Check if ALL schedules of this invoice are PAID
        setTimeout(() => {
          checkInvoiceCompletion(sch.invoice_id);
        }, 100);

        return updated;
      }
      return sch;
    }));
  };

  const checkInvoiceCompletion = (invoiceId: string) => {
    setRepaymentSchedules(currentSchedules => {
      const parentSchedules = currentSchedules.filter(s => s.invoice_id === invoiceId);
      const allPaid = parentSchedules.every(s => s.status === "PAID");
      
      if (allPaid && parentSchedules.length > 0) {
        setInvoices(currentInvoices => currentInvoices.map(inv => {
          if (inv.id === invoiceId && inv.status !== "COMPLETED") {
            const updated = { ...inv, status: "COMPLETED" as const, row_version: inv.row_version + 1 };
            postAuditLog("INVOICE_FULLY_COMPLETED", "INVOICE", invoiceId, inv, updated);
            
            // Allocate interest profit share
            const bonusYield = Math.round(inv.funding_amount * 0.035);
            setPool(prevPool => ({
              ...prevPool,
              total_return_generated: prevPool.total_return_generated + bonusYield
            }));

            // Boost investor yield pool balances
            setWalletBalances(prevW => ({
              ...prevW,
              "party-investor-01": (prevW["party-investor-01"] || 0) + Math.round(bonusYield * 0.8),
              "party-coop-01": (prevW["party-coop-01"] || 0) + Math.round(bonusYield * 0.2)
            }));

            return updated;
          }
          return inv;
        }));
      }
      return currentSchedules;
    });
  };

  // 9. ACTION: Warung raises dispute
  const handleRaiseDispute = (invoiceId: string, reason: string, proofUrls: string[]) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const updated = {
          ...inv,
          status: "DISPUTE" as const,
          dispute_reason: reason,
          dispute_proof_url: proofUrls[0],
          dispute_proof_urls: proofUrls,
          row_version: inv.row_version + 1
        };
        postAuditLog("RAISE_DISPUTE_CLAIM", "INVOICE", invoiceId, inv, updated);
        return updated;
      }
      return inv;
    }));
  };

  // 10. ACTION: Koperasi resolves dispute (RELEASE or REFUND)
  const handleResolveDispute = (invoiceId: string, solution: "RELEASE" | "REFUND") => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        if (solution === "RELEASE") {
          const updated = {
            ...inv,
            status: "PAYOUT_PROCESSING" as const,
            dispute_solution: "RELEASE_TO_SUPPLIER",
            row_version: inv.row_version + 1
          };
          postAuditLog("RESOLVE_DISPUTE_RELEASE", "INVOICE", invoiceId, inv, updated);
          
          setTimeout(() => {
            triggerPayoutWorker(invoiceId, inv.funding_amount, inv.supplier_id);
          }, 1000);

          return updated;
        } else {
          const updated = {
            ...inv,
            status: "REJECTED" as const,
            dispute_solution: "REFUND_TO_KOPERASI_POOL",
            row_version: inv.row_version + 1
          };

          // Release Pool locks
          setPool(prevPool => ({
            ...prevPool,
            locked_amount: Math.max(0, prevPool.locked_amount - inv.funding_amount),
            available_amount: prevPool.available_amount + inv.funding_amount
          }));

          // Restore credit limit to warung
          setWarungProfiles(prevP => prevP.map(p => {
            if (p.party_id === inv.warung_id) {
              return { ...p, available_limit: p.available_limit + inv.funding_amount };
            }
            return p;
          }));

          // Ledger accounting adjustment
          setLedgerAccounts(prevAccounts => prevAccounts.map(acc => {
            if (acc.account_no === "10100") {
              return {
                ...acc,
                locked_balance: Math.max(0, acc.locked_balance - inv.funding_amount),
                available_balance: acc.available_balance + inv.funding_amount
              };
            }
            if (acc.account_no === "12100") {
              return {
                ...acc,
                available_balance: Math.max(0, acc.available_balance - inv.funding_amount)
              };
            }
            return acc;
          }));

          postAuditLog("RESOLVE_DISPUTE_REFUND", "INVOICE", invoiceId, inv, updated);
          postStellarTx("INVOICE", invoiceId, "REFUND_ESCROW");
          return updated;
        }
      }
      return inv;
    }));
  };

  // 11. ACTION: Background Overdue Scan Scheduler simulation (Koperasi)
  const handleTriggerOverdueScan = () => {
    const today = new Date().toISOString().substring(0, 10);
    setRepaymentSchedules(prevSchedules => {
      return prevSchedules.map(sch => {
        if (sch.status === "PENDING" && sch.due_date < today) {
            const updated = { ...sch, status: "OVERDUE" as const };
            postAuditLog("DETECTOR_OVERDUE_SCHED", "REPAYMENT_SCHEDULE", sch.id, sch, updated);

            // Update parent invoice status to OVERDUE
            setInvoices(currentInvoices => currentInvoices.map(inv => {
              if (inv.id === sch.invoice_id) {
                const updInv = { ...inv, status: "OVERDUE" as const };
                postAuditLog("SET_INVOICE_OVERDUE", "INVOICE", inv.id, inv, updInv);
                
                // Reduce warung reputation trust score (-15 points)
                setWarungProfiles(prevProf => prevProf.map(p => {
                  if (p.party_id === inv.warung_id) {
                    return { ...p, trust_score: Math.max(0, p.trust_score - 15.0) };
                  }
                  return p;
                }));

                return updInv;
              }
              return inv;
            }));

            return updated;
        }
        return sch;
      });
    });
  };

  // 12. ACTION: Investor Tops Up capital
  const handleTopUp = (amount: number, ref: string) => {
    const updatedContrib: PoolContribution = {
      id: generateId("CONTRIB"),
      pool_id: "pool-01",
      investor_id: activePartyId,
      amount,
      status: "SETTLED",
      topup_reference: ref,
      created_at: new Date().toISOString()
    };

    setContributions(prev => [...prev, updatedContrib]);

    // Boost available pool amount
    setPool(prevPool => ({
      ...prevPool,
      available_amount: prevPool.available_amount + amount
    }));

    // Update ledgers
    setLedgerAccounts(prevLed => prevLed.map(acc => {
      if (acc.account_no === "10100") { // cash platform
        return { ...acc, available_balance: acc.available_balance + amount };
      }
      if (acc.party_id === activePartyId) { // investor liability ledger
        return { ...acc, available_balance: acc.available_balance + amount };
      }
      return acc;
    }));

    postAuditLog("DEPOSIT_INVESTOR_FUNDS", "POOL_CONTRIBUTION", updatedContrib.id, {}, updatedContrib);
    postStellarTx("TOPUP", updatedContrib.id, "TOPUP_POOL");
  };

  // 13. ACTION: Investor withdraws available yield
  const handleWithdraw = (amount: number, fee: number) => {
    const netAmount = amount - fee;

    setWalletBalances(prev => ({
      ...prev,
      [activePartyId]: Math.max(0, (prev[activePartyId] || 0) - amount)
    }));

    setPool(prevPool => ({
      ...prevPool,
      available_amount: Math.max(0, prevPool.available_amount - amount)
    }));

    setLedgerAccounts(prevAccounts => prevAccounts.map(acc => {
      if (acc.party_id === activePartyId) { // reduce liabilities
        return { ...acc, available_balance: Math.max(0, acc.available_balance - amount) };
      }
      if (acc.account_no === "10100") { // cash asset physical decrease by net cashout
        return { ...acc, available_balance: Math.max(0, acc.available_balance - netAmount) };
      }
      if (acc.account_no === "40100") { // Platform admin fee revenue boosted by Rp 5k fee
        return { ...acc, available_balance: acc.available_balance + fee };
      }
      return acc;
    }));

    const wdrId = generateId("WDR");
    postAuditLog("WITHDRAW_INVESTOR_YIELD", "WITHDRAWAL", wdrId, { amount }, { amount, netAmount, fee });
    postStellarTx("WITHDRAWAL", wdrId, "WITHDRAW");
  };

  // 14. ACTION: Supplier adds new Product to Catalog
  const handleAddProduct = (prodData: Omit<Product, "id" | "supplier_id" | "is_active">) => {
    const newProduct: Product = {
      ...prodData,
      id: generateId("PROD"),
      supplier_id: activePartyId,
      is_active: true
    };
    setProducts(prev => [newProduct, ...prev]);
    postAuditLog("ADD_PRODUCT_CATALOG", "PRODUCT", newProduct.id, {}, newProduct);
  };

  // 15. ACTION: Supplier updates stock status
  const handleUpdateStockStatus = (productId: string, status: "AVAILABLE" | "LIMITED" | "OUT_OF_STOCK") => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updated = { ...p, stock_status: status };
        postAuditLog("UPDATE_STOCK_STATUS", "PRODUCT", productId, p, updated);
        return updated;
      }
      return p;
    }));
  };

  // 16. ACTION: Admin approves KYC profile for onboarding user
  const handleApprovePartyKYC = (partyId: string) => {
    setParties(prevParties => prevParties.map(p => {
      if (p.id === partyId) {
        const updated = { ...p, kyc_status: "APPROVED" as const };
        
        // Grant credit limit automatically based on warung profile
        setWarungProfiles(prevProf => prevProf.map(wp => {
          if (wp.party_id === partyId) {
            const initLimit = 10000000;
            return {
              ...wp,
              limit_amount: initLimit,
              available_limit: initLimit
            };
          }
          return wp;
        }));

        postAuditLog("APPROVE_KYC_PROFILE", "PARTY", partyId, p, updated);
        return updated;
      }
      return p;
    }));
  };

  // 17. ACTION: Admin rejects KYC profile
  const handleRejectPartyKYC = (partyId: string) => {
    setParties(prevParties => prevParties.map(p => {
      if (p.id === partyId) {
        const updated = { ...p, kyc_status: "NEED_REVISION" as const };
        postAuditLog("REJECT_KYC_PROFILE", "PARTY", partyId, p, updated);
        return updated;
      }
      return p;
    }));
  };

  // 18. ACTION: Onboarding files submission (Warung upload simulation)
  const handleUpdateKYC = (
    legalName: string,
    ownerName: string,
    address: string,
    monthlyTurnover: number,
    ktpNumber: string,
    kycFile: File | null
  ) => {
    setParties(prev => prev.map(p => {
      if (p.id === activePartyId) {
        return {
          ...p,
          legal_name: legalName,
          kyc_status: "PENDING" as const,
          ktp_number_encrypted: ktpNumber
        };
      }
      return p;
    }));

    setWarungProfiles(prev => prev.map(wp => {
      if (wp.party_id === activePartyId) {
        return {
          ...wp,
          owner_name: ownerName,
          address,
          monthly_turnover_estimate: monthlyTurnover
        };
      }
      return wp;
    }));

    postAuditLog("SUBMIT_ONBOARDING_KYC", "PARTY", activePartyId, {}, { legalName, ownerName, address, monthlyTurnover });
  };

  // 19. ACTION: KMS key rotation simulation
  const handleRotateKey = () => {
    setIsRotatingKey(true);
    setTimeout(() => {
      const nextKey = kmsKeyId === "kms-key-v1-active" ? "kms-key-v1-rotated" : "kms-key-v1-active";
      setKmsKeyId(nextKey);
      setIsRotatingKey(false);
      
      const auditLogItem: AuditLog = {
        id: generateId("AUDIT"),
        actor_user_id: activePartyId,
        actor_name: activeParty?.display_name || "Platform Admin",
        action: "ROTATE_KMS_KEY_ALGORITHM",
        entity_type: "KMS_VAULT_KEY_DEC",
        entity_id: nextKey,
        before_json: JSON.stringify({ active_key: kmsKeyId }),
        after_json: JSON.stringify({ active_key: nextKey, encryption_algorithm: "AES-256-GCM" }),
        ip_address: "192.168.1.10",
        timestamp: new Date().toISOString()
      };
      
      setAuditLogs(prev => [auditLogItem, ...prev]);
    }, 1000);
  };

  // Reset all simulation back to pristine state
  const handleResetState = () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang (reset) seluruh data simulasi? Seluruh pesanan, repayment, and audit logs baru akan terhapus.")) {
      setParties(initialParties);
      setWarungProfiles(initialWarungProfiles);
      setSupplierProfiles(initialSupplierProfiles);
      setProducts(initialProducts);
      setPool(initialPools[0]);
      setContributions(initialContributions);
      setInvoices(initialInvoices);
      setInvoiceItems(initialInvoiceItems);
      setRepaymentSchedules(initialRepaymentSchedules);
      setPayouts([]);
      setLedgerAccounts(initialLedgerAccounts);
      setStellarTransactions(initialStellarTransactions);
      setAuditLogs(initialAuditLogs);
      setKmsKeyId("kms-key-v1-active");
      
      setWalletBalances({
        "party-warung-01": 500000,
        "party-warung-02": 250000,
        "party-warung-03": 1200000,
        "party-warung-04": 150000,
        "party-warung-05": 0,
        "party-warung-06": 400000,
        "party-warung-07": 0,
        "party-warung-08": 600000,
        "party-warung-09": 100000,
        "party-warung-10": 850000,
        "party-supplier-01": 15000000,
        "party-supplier-02": 8000000,
        "party-supplier-03": 12000000,
        "party-investor-01": 2450000,
        "party-investor-02": 980000,
        "party-investor-03": 490000,
        "party-coop-01": 5000000,
        "party-admin-01": 15000000
      });

      alert("Data simulasi sukses dikembalikan ke kondisi awal (pristine state)!");
    }
  };

  const currentWalletBalance = walletBalances[activePartyId] || 0;

  if (showLanding) {
    return (
      <Suspense fallback={<AppLoadingFallback />}>
        <LandingPage onSignIn={() => setShowLanding(false)} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AppLoadingFallback />}>
      <div className="min-h-screen flex flex-col bg-[#07080A] text-[#E0E0E0]">
      {loggedIn ? (
        <div className="flex-grow flex flex-col md:flex-row bg-[#0A0B0D] text-[#E0E0E0] font-sans">
          
          {/* Unified Left Sidebar */}
          <Sidebar
            currentRole={currentRole}
            activeParty={activeParty}
            walletBalance={currentWalletBalance}
            onSelectRole={setCurrentRole}
            onResetState={handleResetState}
            kmsKeyId={kmsKeyId}
            isRotatingKey={isRotatingKey}
            onRotateKey={handleRotateKey}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSignOut={() => {
              setLoggedIn(false);
              setShowLanding(true);
            }}
            invoices={invoices}
          />

          {/* Main Dashboard Layout Area */}
          <div className="flex-grow flex flex-col min-w-0">
            <WalletConnectionBar
              wallet={stellarWallet.wallet}
              loading={stellarWallet.loading}
              connected={stellarWallet.connected}
              networkMatches={stellarWallet.networkMatches}
              onConnect={stellarWallet.connect}
              onDisconnect={stellarWallet.disconnect}
              onRefresh={stellarWallet.refresh}
            />
            
            {/* Sub-header / Top Alert bar inside Main Dashboard */}
            <div className="bg-[#0F1115] border-b border-[#1F2127] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  MODUL SIMULASI AKTIF: Peran {currentRole === RoleCode.WARUNG ? "Warung" : currentRole === RoleCode.SUPPLIER ? "Supplier" : currentRole === RoleCode.KOPERASI ? "Koperasi KUD" : currentRole === RoleCode.INVESTOR ? "Investor" : "Administrator"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[10.5px] font-mono text-gray-400">
                <span>Settlement: <span className="text-emerald-400 font-semibold">Stellar Testnet</span></span>
                <span className="text-gray-600">|</span>
                <span>Vault: <span className="text-emerald-400 font-semibold">AES-256 Enabled</span></span>
              </div>
            </div>

            {/* Core Interactive Area */}
            <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
              {currentRole === RoleCode.WARUNG && (
                <WarungDashboard
                  activeParty={activeParty!}
                  warungProfile={activeWarungProfile}
                  products={products}
                  invoices={invoices}
                  invoiceItems={invoiceItems}
                  repaymentSchedules={repaymentSchedules}
                  onCreateInvoice={handleCreateInvoice}
                  onUpdateDraftInvoice={handleUpdateDraftInvoice}
                  onSubmitDraftInvoice={handleSubmitDraftInvoice}
                  onDeleteDraftInvoice={handleDeleteDraftInvoice}
                  onConfirmReceipt={handleConfirmReceipt}
                  onPayInstallment={handlePayInstallment}
                  onRaiseDispute={handleRaiseDispute}
                  onUpdateKYC={handleUpdateKYC}
                  kmsKeyId={kmsKeyId}
                  activeTab={activeTab as any}
                  onTabChange={setActiveTab as any}
                />
              )}

              {currentRole === RoleCode.SUPPLIER && (
                <SupplierDashboard
                  activeParty={activeParty!}
                  supplierProfile={activeSupplierProfile}
                  products={products}
                  invoices={invoices}
                  invoiceItems={invoiceItems}
                  payouts={payouts}
                  onAddProduct={handleAddProduct}
                  onUpdateStockStatus={handleUpdateStockStatus}
                  onApproveInvoice={handleApproveInvoice}
                  onRejectInvoice={handleRejectInvoice}
                  onShipInvoice={handleSupplierShip}
                  activeTab={activeTab as any}
                  onTabChange={setActiveTab as any}
                />
              )}

              {currentRole === RoleCode.KOPERASI && (
                <KoperasiDashboard
                  activeParty={activeParty!}
                  pool={pool}
                  contributions={contributions}
                  invoices={invoices}
                  invoiceItems={invoiceItems}
                  warungProfiles={warungProfiles}
                  repaymentSchedules={repaymentSchedules}
                  parties={parties}
                  onApproveFunding={handleApproveFunding}
                  onRejectFunding={handleRejectFunding}
                  onResolveDispute={handleResolveDispute}
                  onTriggerOverdueScan={handleTriggerOverdueScan}
                  activeTab={activeTab as any}
                  onTabChange={setActiveTab as any}
                />
              )}

              {currentRole === RoleCode.INVESTOR && (
                <InvestorDashboard
                  activeParty={activeParty!}
                  pool={pool}
                  contributions={contributions}
                  invoices={invoices}
                  parties={parties}
                  onTopUp={handleTopUp}
                  onWithdraw={handleWithdraw}
                  walletBalance={currentWalletBalance}
                  activeTab={activeTab as any}
                  onTabChange={setActiveTab as any}
                />
              )}

              {currentRole === RoleCode.ADMIN && (
                <AdminDashboard
                  activeParty={activeParty!}
                  parties={parties}
                  warungProfiles={warungProfiles}
                  supplierProfiles={supplierProfiles}
                  ledgerAccounts={ledgerAccounts}
                  stellarTransactions={stellarTransactions}
                  auditLogs={auditLogs}
                  onApprovePartyKYC={handleApprovePartyKYC}
                  onRejectPartyKYC={handleRejectPartyKYC}
                  kmsKeyId={kmsKeyId}
                  isRotatingKey={isRotatingKey}
                  onRotateKey={handleRotateKey}
                  activeTab={activeTab as any}
                  onTabChange={setActiveTab as any}
                />
              )}
            </main>

            <footer className="bg-[#07080A] border-t border-[#1F2127] py-4 text-center text-[10px] text-gray-500 font-mono">
              <div className="max-w-7xl mx-auto px-4">
                <p>© 2026 Warung Supplier Credit (WSC) Platform • Sandboxed MVP Hackathon.</p>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col bg-[#07080A] text-[#E0E0E0] relative">
          {/* Ambient grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#14161C_1px,transparent_1px),linear-gradient(to_bottom,#14161C_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-25"></div>

          {/* Top Header to go back */}
          <header className="relative z-10 border-b border-[#1A1D23] bg-[#07080A]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 p-1.5 rounded text-black flex items-center justify-center">
                  <Landmark className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white font-sans">WSC Platform</span>
              </div>
              <button
                onClick={() => setShowLanding(true)}
                className="text-xs font-bold text-gray-400 hover:text-white transition-all flex items-center gap-1.5"
              >
                ← Kembali ke Beranda
              </button>
            </div>
          </header>

          <div className="flex-grow flex items-center justify-center p-4 relative z-10">
            <div className="max-w-5xl w-full">
              <RoleSelector
                currentRole={currentRole}
                onSelectRole={(role) => {
                  setCurrentRole(role);
                  setLoggedIn(true);
                }}
                userEmail={userEmail}
              />
            </div>
          </div>
          
          <footer className="bg-[#0F1115] border-t border-[#262626] py-6 text-center text-xs text-gray-500 font-mono relative z-10">
            <div className="max-w-7xl mx-auto px-4">
              <p>© 2026 Warung Supplier Credit (WSC) Platform • Sandboxed MVP Hackathon.</p>
            </div>
          </footer>
        </div>
      )}
      </div>
    </Suspense>
  );
}

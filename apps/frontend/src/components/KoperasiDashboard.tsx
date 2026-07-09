/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Landmark,
  ShieldCheck,
  Coins,
  AlertTriangle,
  Scale,
  Award,
  Users,
  Check,
  X,
  Lock,
  ChevronRight,
  ShieldAlert,
  Clock,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import {
  RoleCode,
  Party,
  WarungProfile,
  CooperativePool,
  PoolContribution,
  Invoice,
  InvoiceItem,
  RepaymentSchedule
} from "../types";
import { formatRupiah, maskPII } from "../utils";

interface KoperasiDashboardProps {
  activeParty: Party;
  pool: CooperativePool;
  contributions: PoolContribution[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  warungProfiles: WarungProfile[];
  repaymentSchedules: RepaymentSchedule[];
  parties: Party[];
  onApproveFunding: (invoiceId: string) => void;
  onRejectFunding: (invoiceId: string, reason: string) => void;
  onResolveDispute: (invoiceId: string, solution: "RELEASE" | "REFUND") => void;
  onTriggerOverdueScan: () => void;
}

export default function KoperasiDashboard({
  activeParty,
  pool,
  contributions,
  invoices,
  invoiceItems,
  warungProfiles,
  repaymentSchedules,
  parties,
  onApproveFunding,
  onRejectFunding,
  onResolveDispute,
  onTriggerOverdueScan,
  activeTab: propActiveTab,
  onTabChange
}: KoperasiDashboardProps & { activeTab?: "dashboard" | "pool" | "persetujuan" | "dispute" | "overdue"; onTabChange?: (tab: "dashboard" | "pool" | "persetujuan" | "dispute" | "overdue") => void }) {
  // Tabs
  const [localActiveTab, setLocalActiveTab] = useState<"dashboard" | "pool" | "persetujuan" | "dispute" | "overdue">("dashboard");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;

  // Detailed Modal/Expand
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [rejectingInvoiceId, setRejectingInvoiceId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Filter invoices for approval (Submitted to supplier, or approved by supplier)
  // Koperasi can only approve funding after supplier has accepted the order.
  const pendingInvoices = invoices.filter(inv => ["SUPPLIER_APPROVED", "COOP_REVIEW"].includes(inv.status));

  // Filter active escrow invoices
  const activeEscrows = invoices.filter(inv => ["ESCROW_LOCKED", "SHIPPED", "RECEIVED_CONFIRMED"].includes(inv.status));
  const escrowHistory = invoices.filter(inv => ["PAYOUT_PROCESSING", "REPAYMENT_ACTIVE", "COMPLETED", "REJECTED"].includes(inv.status));

  // Filter dispute invoices
  const disputeInvoices = invoices.filter(inv => inv.status === "DISPUTE");
  const disputeHistory = invoices.filter(inv => Boolean(inv.dispute_solution));

  // Filter overdue schedules or invoices
  const overdueSchedules = repaymentSchedules.filter(sch => sch.status === "OVERDUE");
  const overdueInvoices = invoices.filter(inv => inv.status === "OVERDUE");

  // Helper to get warung profile
  const getWarungInfo = (warungId: string) => {
    const profile = warungProfiles.find(w => w.party_id === warungId);
    const party = parties.find(p => p.id === warungId);
    return { profile, party };
  };

  // Helper to determine risk level & color badge
  const getRiskBadge = (score: number) => {
    if (score >= 90) {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
          <Award className="w-3 h-3" />
          LOW RISK
        </span>
      );
    } else if (score >= 70) {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          MEDIUM RISK
        </span>
      );
    } else {
      return (
        <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          HIGH RISK
        </span>
      );
    }
  };

  const handleApprove = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    if (invoice.funding_amount > pool.available_amount) {
      alert("Saldo Pool Koperasi tidak cukup untuk mendanai invoice ini! Silakan lakukan top-up pool pendanaan dari investor terlebih dahulu.");
      return;
    }

    onApproveFunding(invoiceId);
    setSelectedInvoice(null);
    alert("Invoice disetujui! Dana dialokasikan dari Pool Koperasi dan terkunci di smart escrow Stellar (Soroban). Supplier dapat mulai mengirimkan barang.");
  };

  const submitReject = (invoiceId: string) => {
    if (!rejectReason.trim()) {
      alert("Alasan penolakan wajib diisi agar Warung bisa memperbaiki pengajuannya.");
      return;
    }

    onRejectFunding(invoiceId, rejectReason.trim());
    setRejectingInvoiceId(null);
    setRejectReason("");
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* TOP ROW: Pool Economics Metrics */}
      {activeTab === "dashboard" && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Coins className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Saldo Tersedia (Pool)</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(pool.available_amount)}</div>
            <p className="text-[9px] text-emerald-400 font-semibold mt-0.5 font-mono">Siap Dialokasikan</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg animate-pulse">
            <Lock className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Saldo Terkunci (Escrow)</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(pool.locked_amount)}</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Aman di Soroban Contract</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Total Repayment Selesai</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(pool.total_repaid_amount)}</div>
            <p className="text-[9px] text-emerald-400 font-semibold mt-0.5 font-mono">Repayment Sukses</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Return Hasil Koperasi</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(pool.total_return_generated)}</div>
            <p className="text-[9px] text-teal-400 font-semibold mt-0.5 font-mono">Akumulasi Imbal Hasil</p>
          </div>
        </div>
      </div>
      )}

      {/* MID ROW: Dashboard Tabs switcher */}
      {!propActiveTab && (
        <div className="flex border border-[#262626] bg-[#0F1115] p-1 rounded-xl shadow-md">
          <button
            onClick={() => { setActiveTab("dashboard"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "dashboard" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Coins className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab("persetujuan"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "persetujuan" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Scale className="w-4.5 h-4.5" />
            <span>Queue Persetujuan Pendanaan</span>
            {pendingInvoices.length > 0 && (
              <span className="bg-emerald-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full font-mono">
                {pendingInvoices.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("pool"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "pool" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Landmark className="w-4.5 h-4.5" />
            <span>Manajemen Pool &amp; Kontribusi</span>
          </button>
          <button
            onClick={() => { setActiveTab("dispute"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "dispute" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <AlertTriangle className="w-4.5 h-4.5" />
            <span>Resolusi Dispute Sengketa</span>
            {disputeInvoices.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce font-mono">
                {disputeInvoices.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("overdue"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "overdue" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Overdue Scanner &amp; Kolektibilitas</span>
          </button>
        </div>
      )}

      {/* BOTTOM SECTION: Content tabs */}
      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] p-5">
              <h3 className="font-extrabold text-white text-sm mb-3">Antrian Butuh Keputusan</h3>
              <div className="space-y-2">
                {pendingInvoices.slice(0, 5).map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => { setActiveTab("persetujuan"); setSelectedInvoice(inv); }}
                    className="w-full rounded-xl border border-[#262626] bg-[#14161C] p-3 text-left hover:border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-white">{inv.invoice_no}</span>
                      <span className="font-bold text-emerald-400">{formatRupiah(inv.funding_amount)}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-400">Review limit, DP, tenor, dan risiko Warung.</div>
                  </button>
                ))}
                {pendingInvoices.length === 0 && (
                  <p className="rounded-xl border border-[#262626] bg-[#14161C] p-4 text-xs text-gray-400">Tidak ada pembiayaan yang menunggu persetujuan.</p>
                )}
              </div>
            </div>
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] p-5">
              <h3 className="font-extrabold text-white text-sm mb-3">Kontrol Risiko</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Dashboard ini merangkum posisi pool, escrow, dan pengajuan yang perlu keputusan. Detail operasional tetap berada di menu persetujuan, pool, dispute, dan kolektibilitas.
              </p>
            </div>

            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm">
                Riwayat Escrow Selesai / Refund
              </div>
              {escrowHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs italic font-mono">
                  Belum ada escrow yang selesai atau direfund.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#14161C] border-b border-[#262626] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">No Invoice</th>
                        <th className="p-4">Warung</th>
                        <th className="p-4">Nilai Barang</th>
                        <th className="p-4">Nilai Pool</th>
                        <th className="p-4">Status Akhir</th>
                        <th className="p-4">Keputusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-gray-300 font-medium">
                      {escrowHistory.map(esc => {
                        const { party } = getWarungInfo(esc.warung_id);
                        return (
                          <tr key={esc.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-bold text-white">{esc.invoice_no}</td>
                            <td className="p-4 font-bold text-gray-200">{party?.display_name}</td>
                            <td className="p-4 font-extrabold text-white">{formatRupiah(esc.total_amount)}</td>
                            <td className="p-4 font-extrabold text-emerald-400">{formatRupiah(esc.funding_amount)}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                {esc.status}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400">{esc.dispute_solution || "Escrow release normal"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] flex justify-between items-center">
                <h3 className="font-extrabold text-white text-sm">Riwayat Arbitrase Dispute</h3>
                <span className="text-xs text-gray-400 font-semibold font-mono">{disputeHistory.length} Keputusan</span>
              </div>
              {disputeHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs italic font-mono">
                  Belum ada dispute yang diputus oleh koperasi.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#14161C] border-b border-[#262626] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">No Invoice</th>
                        <th className="p-4">Warung</th>
                        <th className="p-4">Alasan Dispute</th>
                        <th className="p-4">Nilai Barang</th>
                        <th className="p-4">Keputusan Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-gray-300 font-medium">
                      {disputeHistory.map(dis => {
                        const { party } = getWarungInfo(dis.warung_id);
                        return (
                          <tr key={dis.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-bold text-white">{dis.invoice_no}</td>
                            <td className="p-4 font-bold text-gray-200">{party?.display_name}</td>
                            <td className="p-4 text-gray-400 max-w-xs truncate">{dis.dispute_reason || "-"}</td>
                            <td className="p-4 font-extrabold text-white">{formatRupiah(dis.total_amount)}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                {dis.dispute_solution}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 1: PERSIDANGAN / APPROVAL QUEUE */}
        {activeTab === "persetujuan" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] flex justify-between items-center">
                <h3 className="font-extrabold text-white text-sm">Review Kelayakan Kredit &amp; Alokasi Dana Pool</h3>
                <span className="text-xs text-gray-400 font-semibold font-mono">{pendingInvoices.length} Menunggu Persetujuan Koperasi</span>
              </div>

              {pendingInvoices.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-20 text-emerald-500" />
                  <p className="text-xs font-bold text-gray-300">Semua Pengajuan Selesai Di-review</p>
                  <p className="text-[10px] text-gray-500 mt-1">Gunakan role Warung di atas untuk mengajukan pembiayaan invoice baru harian.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1F2127]">
                  {pendingInvoices.map(inv => {
                    const { profile, party } = getWarungInfo(inv.warung_id);
                    const isSelected = selectedInvoice?.id === inv.id;

                    return (
                      <div key={inv.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">{inv.invoice_no}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-xs font-bold text-gray-200">{party?.display_name || "Mitra Warung"}</span>
                              {profile && getRiskBadge(profile.trust_score)}
                            </div>
                            
                            <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-4">
                              <span>Pembiayaan Pokok: <strong className="text-emerald-400 font-bold">{formatRupiah(inv.funding_amount)}</strong> (Total: {formatRupiah(inv.total_amount)})</span>
                              <span>DP: <strong className="text-gray-300">{formatRupiah(inv.down_payment_amount)}</strong></span>
                              <span>Tenor: <strong className="text-gray-300">{inv.tenor_days} Hari</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 shrink-0">
                            {/* Funding approval decisions */}
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleApprove(inv.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow transition-colors"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Setujui &amp; Lock Dana</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingInvoiceId(inv.id);
                                  setSelectedInvoice(inv);
                                }}
                                className="bg-[#14161C] hover:bg-red-950/20 text-red-400 border border-[#262626] hover:border-red-500/20 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>

                            <button
                              onClick={() => setSelectedInvoice(isSelected ? null : inv)}
                              className="p-1.5 hover:bg-[#14161C] rounded border border-[#262626]"
                            >
                              <ChevronRight className={`w-4 h-4 transform transition-transform text-gray-400 ${isSelected ? "rotate-90 text-white" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Review panel */}
                        {isSelected && (
                          <div className="mt-4 bg-[#0A0B0D] p-4 rounded-xl border border-[#262626] space-y-4">
                            {rejectingInvoiceId === inv.id && (
                              <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/20 space-y-3 shadow-sm">
                                <h4 className="font-extrabold text-xs text-red-200 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                  Alasan Penolakan Pendanaan
                                </h4>
                                <textarea
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Contoh: DP terlalu kecil untuk nilai pesanan, tenor perlu dipendekkan, atau risiko omzet belum memadai..."
                                  className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#262626] rounded-lg text-xs text-white focus:ring-1 focus:ring-red-500 outline-none"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setRejectingInvoiceId(null);
                                      setRejectReason("");
                                    }}
                                    className="px-3 py-1.5 bg-[#0F1115] hover:bg-[#14161C] border border-[#262626] rounded-lg text-[11px] font-bold text-gray-400"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={() => submitReject(inv.id)}
                                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px]"
                                  >
                                    Kirim Penolakan
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                              {/* Left profile analysis */}
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Analisis Omzet &amp; Riwayat:</h5>
                                <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626] space-y-1.5 leading-relaxed text-gray-300">
                                  <div>
                                    <span className="text-gray-500">Nama Pemilik:</span>{" "}
                                    <strong className="text-white font-bold">{profile?.owner_name}</strong>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Omzet Bulanan:</span>{" "}
                                    <strong className="text-white">{formatRupiah(profile?.monthly_turnover_estimate || 0)}</strong>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Alamat:</span>{" "}
                                    <span className="text-gray-400">{profile?.address}, {profile?.city}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Mid items list to analyze */}
                              <div>
                                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono mb-2">Item Invoice Yang Didanai:</h5>
                                <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626] space-y-2 max-h-28 overflow-y-auto">
                                  {invoiceItems.filter(item => item.invoice_id === inv.id).map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-[11px] text-gray-300">
                                      <span>{item.product_name_snapshot} <strong className="text-white">x{item.qty}</strong></span>
                                      <span className="font-bold text-emerald-400">{formatRupiah(item.line_total)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right risk mitigation rules */}
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Mitigasi Risiko Koperasi:</h5>
                                <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626] text-[11px] leading-relaxed text-gray-300 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>DP {Math.round((inv.down_payment_amount / inv.total_amount) * 100)}% Terbayar Aman</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Skor Trust: {profile?.trust_score}/100</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-400">
                                    <span>Limit Sisa: {formatRupiah(profile?.available_limit || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of active escrow locks */}
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm">
                Daftar Escrow Soroban Yang Sedang Berjalan (Dana Terkunci)
              </div>
              
              {activeEscrows.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs italic font-mono">
                  Belum ada dana locked di smart escrow.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#14161C] border-b border-[#262626] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">No Invoice</th>
                        <th className="p-4">Warung Penerima</th>
                        <th className="p-4">Total Rupiah Terkunci</th>
                        <th className="p-4">Status Pengiriman</th>
                        <th className="p-4">Smart Escrow State (Stellar)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-gray-300 font-medium">
                      {activeEscrows.map(esc => {
                        const { party } = getWarungInfo(esc.warung_id);
                        return (
                          <tr key={esc.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-bold text-white">{esc.invoice_no}</td>
                            <td className="p-4 font-bold text-gray-200">{party?.display_name}</td>
                            <td className="p-4 font-extrabold text-emerald-400">{formatRupiah(esc.funding_amount)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                esc.status === "ESCROW_LOCKED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                esc.status === "SHIPPED" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}>
                                {esc.status === "ESCROW_LOCKED" ? "SEDANG DIKEMAS SUPPLIER" :
                                 esc.status === "SHIPPED" ? "BARANG SEDANG DI JALAN" :
                                 "DITERIMA (PROSES CASHOUT)"
                                }
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-gray-400">
                              <span className="flex items-center gap-1 text-[10px] bg-[#14161C] px-2 py-0.5 rounded border border-[#262626] w-fit">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                SOROBAN_CONTRACT_LOCKED
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: POOL MANAGER & CONTRIBUTIONS */}
        {activeTab === "pool" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pool specs */}
              <div className="md:col-span-1 bg-[#0F1115] p-5 rounded-2xl border border-[#262626] shadow-md space-y-4">
                <h4 className="font-extrabold text-white text-sm">Parameter Kebijakan Pool</h4>
                <div className="space-y-3 text-xs leading-relaxed text-gray-300">
                  <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626]/60">
                    <div className="font-bold text-white">Return Sharing Policy:</div>
                    <div className="mt-1 text-gray-400">80% Investor, 20% Koperasi Reserve Fund.</div>
                  </div>
                  <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626]/60">
                    <div className="font-bold text-white">Maksimal Tenor Anggota:</div>
                    <div className="mt-1 text-gray-400">60 Hari (Jatuh Tempo Cicilan Fleksibel).</div>
                  </div>
                  <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626]/60">
                    <div className="font-bold text-white">Withdrawal Fee Operational:</div>
                    <div className="mt-1 text-gray-400">Flat Rp 2.500 - Rp 5.000 per transaksi pencairan.</div>
                  </div>
                </div>
              </div>

              {/* Pool contributions list (by investors) */}
              <div className="md:col-span-2 bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
                <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm">
                  Daftar Kontribusi Dana Masuk (Modal Investor)
                </div>
                
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#0A0B0D] border-b border-[#262626] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Tanggal Kontribusi</th>
                        <th className="p-4">Nama Investor</th>
                        <th className="p-4">Referensi Bukti</th>
                        <th className="p-4">Nominal Kontribusi</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-gray-300 font-medium">
                      {contributions.map(con => {
                        const investorParty = parties.find(p => p.id === con.investor_id);
                        return (
                          <tr key={con.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-gray-400">{new Date(con.created_at).toLocaleString("id-ID")}</td>
                            <td className="p-4 font-bold text-white">{investorParty?.display_name || "Investor"}</td>
                            <td className="p-4 font-mono text-gray-500">{con.topup_reference}</td>
                            <td className="p-4 font-extrabold text-emerald-400">{formatRupiah(con.amount)}</td>
                            <td className="p-4 text-center">
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {con.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: DISPUTE ARBITRATION RESOLUTION */}
        {activeTab === "dispute" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] flex justify-between items-center">
                <h3 className="font-extrabold text-white text-sm">Arbitrase Dispute Masalah Pengiriman Sembako</h3>
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                  {disputeInvoices.length} Klaim Aktif
                </span>
              </div>

              {disputeInvoices.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-20 text-emerald-500" />
                  <p className="text-xs font-bold text-gray-300">Tidak Ada Kasus Dispute Sengketa</p>
                  <p className="text-[10px] mt-1">Sistem berjalan dengan aman dan lancar.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#262626]">
                  {disputeInvoices.map(dis => {
                    const { party } = getWarungInfo(dis.warung_id);
                    const isSelected = selectedInvoice?.id === dis.id;

                    return (
                      <div key={dis.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">{dis.invoice_no}</span>
                              <span className="bg-red-500/10 text-red-400 border border-red-500/20 font-extrabold text-[10px] px-2 py-0.5 rounded">
                                DISPUTE ACTIVE
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Warung: <strong className="text-white font-bold">{party?.display_name}</strong> • 
                              Nilai Escrow Beku: <strong className="text-red-400 font-extrabold">{formatRupiah(dis.funding_amount)}</strong>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onResolveDispute(dis.id, "RELEASE");
                                setSelectedInvoice(null);
                                alert("Dispute diselesaikan! Koperasi memutuskan melepas dana penuh kepada Supplier. Status diubah menjadi Cicilan Aktif.");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Lepas Dana ke Supplier
                            </button>
                            <button
                              onClick={() => {
                                onResolveDispute(dis.id, "REFUND");
                                setSelectedInvoice(null);
                                alert("Dispute diselesaikan! Koperasi memutuskan mengembalikan modal penuh ke Pool Koperasi. Invoice ditutup.");
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Refund Balik ke Pool
                            </button>
                            <button
                              onClick={() => setSelectedInvoice(isSelected ? null : dis)}
                              className="p-1.5 hover:bg-[#14161C] rounded border border-[#262626]"
                            >
                              <ChevronRight className={`w-4 h-4 transform transition-transform text-gray-400 ${isSelected ? "rotate-90 text-white" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* Dispute Detail expansion */}
                        {isSelected && (
                          <div className="mt-4 bg-[#0A0B0D] p-4 rounded-xl border border-[#262626] space-y-3">
                            <div className="flex gap-2 text-xs text-red-400">
                              <MessageSquare className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <div className="w-full">
                                <span className="font-bold text-gray-300">Deskripsi Masalah dari Warung:</span>
                                <p className="mt-1 bg-[#14161C] p-2.5 rounded-lg border border-red-900/20 text-gray-300 italic">
                                  &quot;{dis.dispute_reason}&quot;
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2 text-xs">
                              <Award className="w-4 h-4 text-gray-500" />
                              <div>
                                <span className="font-bold text-gray-300">Foto Bukti Kerusakan / Masalah:</span>
                                <div className="mt-1">
                                  <img
                                    src={dis.dispute_proof_url || "https://images.unsplash.com/photo-1586201375761-83865001e31c"}
                                    alt="bukti sengketa"
                                    referrerPolicy="no-referrer"
                                    className="w-32 h-20 object-cover rounded-lg border border-[#262626] shadow-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: OVERDUE / COLLECTIBILITY TRACKING */}
        {activeTab === "overdue" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Automatic scanning scheduler panel */}
            <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#262626] shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-extrabold text-white text-sm">Sistem Pemantauan Otomatis Kolektibilitas Jatuh Tempo</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Klik tombol di samping untuk mensimulasikan scan background worker koperasi atas cicilan warung yang melewati batas waktu pengembalian (due date).
                  </p>
                </div>
                <button
                  onClick={() => {
                    onTriggerOverdueScan();
                    alert("Scan selesai! Status cicilan yang terlambat otomatis diubah menjadi OVERDUE dan mereduksi Trust Score reputasi warung.");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>Scan Kolektibilitas</span>
                </button>
              </div>

              {/* Overdue listing */}
              <div className="border-t border-[#262626] pt-4 text-xs font-bold text-gray-500 uppercase mb-2">
                Daftar Tunggakan Aktif Terdeteksi ({overdueSchedules.length} Jadwal)
              </div>

              {overdueSchedules.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs italic font-mono">
                  Tidak ada tunggakan jatuh tempo yang terdeteksi saat ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueSchedules.map(sch => {
                    const invoice = invoices.find(inv => inv.id === sch.invoice_id);
                    const { party } = invoice ? getWarungInfo(invoice.warung_id) : { party: null };

                    return (
                      <div
                        key={sch.id}
                        className="bg-red-950/10 border border-red-900/20 p-3.5 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-red-400 flex items-center gap-2">
                            <span>{party?.display_name || "Mitra Warung"}</span>
                            <span className="bg-red-500/10 text-red-400 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase border border-red-500/20">
                              OVERDUE
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Invoice: <strong className="font-mono text-gray-200">{invoice?.invoice_no}</strong> • 
                            Jatuh Tempo: <strong className="text-red-400 font-bold">{sch.due_date}</strong>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">Nilai Tagihan</div>
                          <div className="text-sm font-extrabold text-red-400">{formatRupiah(sch.amount_due)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

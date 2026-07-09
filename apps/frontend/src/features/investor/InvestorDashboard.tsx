/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Coins,
  Download,
  BarChart2,
  ShieldCheck,
  ChevronRight,
  Info,
  RefreshCw,
  Clock
} from "lucide-react";
import {
  RoleCode,
  Party,
  CooperativePool,
  PoolContribution,
  Invoice
} from "../../types";
import { formatRupiah, generateId } from "../../utils";

interface InvestorDashboardProps {
  activeParty: Party;
  pool: CooperativePool;
  contributions: PoolContribution[];
  invoices: Invoice[];
  parties: Party[];
  onTopUp: (amount: number, ref: string) => void;
  onWithdraw: (amount: number, fee: number) => void;
  walletBalance: number;
}

export default function InvestorDashboard({
  activeParty,
  pool,
  contributions,
  invoices,
  parties,
  onTopUp,
  onWithdraw,
  walletBalance,
  activeTab: propActiveTab,
  onTabChange
}: InvestorDashboardProps & { activeTab?: "portfolio" | "topup" | "tarik"; onTabChange?: (tab: "portfolio" | "topup" | "tarik") => void }) {
  // Tabs/Sub-actions
  const [localActiveTab, setLocalActiveTab] = useState<"portfolio" | "topup" | "tarik">("portfolio");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;

  // Top Up Form States
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpMethod, setTopUpMethod] = useState("BCA_VA");
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false);

  // Withdraw Form States
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("BCA");
  const [withdrawAccount, setWithdrawAccount] = useState("0245******3928");
  const [isWithdrawProcessing, setIsWithdrawProcessing] = useState(false);

  // Calculate Investor Totals
  const myContributionsList = contributions.filter(c => c.investor_id === activeParty.id);
  const totalContributed = myContributionsList.filter(c => c.status === "SETTLED").reduce((sum, c) => sum + c.amount, 0);

  // Total pool funds (sum of settled contributions)
  const totalPoolCapital = contributions.filter(c => c.status === "SETTLED").reduce((sum, c) => sum + c.amount, 0);
  
  // Percent ownership
  const poolOwnershipShare = totalPoolCapital > 0 ? (totalContributed / totalPoolCapitalCalculation(invoices)) * 100 : 0;
  
  // Simple calculation of investor share return based on share
  const totalPoolReturn = pool.total_return_generated;
  const myShareReturn = Math.round(totalPoolReturn * (totalContributed / (totalPoolCapital || 1)));

  // List of active funded invoices by the pool
  const activeFundedInvoices = invoices.filter(inv => ["ESCROW_LOCKED", "SHIPPED", "REPAYMENT_ACTIVE"].includes(inv.status));

  function totalPoolCapitalCalculation(invList: Invoice[]) {
    // simple simulation total
    return 160000000; // static base representation
  }

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newProdPriceValue(topUpAmount));
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Mohon masukkan nominal top-up yang valid.");
      return;
    }

    setIsTopUpProcessing(true);
    
    // Simulate payment gateway callback speed
    setTimeout(() => {
      const txRef = `TOPUP-TX-${Math.floor(1000 + Math.random() * 9000)}`;
      onTopUp(amountNum, txRef);
      setIsTopUpProcessing(false);
      setTopUpAmount("");
      setActiveTab("portfolio");
      alert(`Top-Up senilai ${formatRupiah(amountNum)} sukses! Modal Anda telah digabungkan ke Pool Koperasi, tercatat di Stellar Ledger, dan siap mendanai invoice warung.`);
    }, 1200);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newProdPriceValue(withdrawAmount));
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Mohon masukkan nominal penarikan yang valid.");
      return;
    }

    if (amountNum > walletBalance) {
      alert("Saldo wallet tersedia Anda tidak mencukupi untuk penarikan ini!");
      return;
    }

    setIsWithdrawProcessing(true);
    const flatFee = 5000; // Rp 5.000 flat withdrawal fee (PRD rule)

    setTimeout(() => {
      onWithdraw(amountNum, flatFee);
      setIsWithdrawProcessing(false);
      setWithdrawAmount("");
      setActiveTab("portfolio");
      alert(`Penarikan dana senilai ${formatRupiah(amountNum)} sukses! Dana diproses ke rekening Anda dikurangi biaya flat Rp 5.000.`);
    }, 1200);
  };

  // Helper helper
  const newProdPriceValue = (str: string) => str.replace(/[^0-9]/g, "");

  return (
    <div className="space-y-6">
      {/* TOP ROW: Portfolio metrics */}
      {activeTab === "portfolio" && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Coins className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Dana Aktif Terinvestasi</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(totalContributed)}</div>
            <p className="text-[9px] text-emerald-400 font-semibold mt-0.5 font-mono">Kontribusi Pool Terkunci</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <BarChart2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Akumulasi Imbal Hasil</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5 font-mono">+{formatRupiah(myShareReturn)}</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Porsi Kepemilikan Pool</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Persentase Saham Pool</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{poolOwnershipShare.toFixed(1)}%</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Terhadap Total Rp160M Pool</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Wallet className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Wallet Balance (Tarik)</div>
            <div className="text-lg font-extrabold text-purple-400 mt-0.5 font-mono">{formatRupiah(walletBalance)}</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Imbal Hasil Dapat Dicairkan</p>
          </div>
        </div>
      </div>
      )}

      {/* TABS SWITCHER */}
      {!propActiveTab && (
        <div className="flex border border-[#262626] bg-[#0F1115] p-1 rounded-xl shadow-md">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "portfolio" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <BarChart2 className="w-4.5 h-4.5" />
            <span>Portofolio &amp; Alokasi Pembiayaan</span>
          </button>
          <button
            onClick={() => setActiveTab("topup")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "topup" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Top-Up Modal Pool (Rupiah)</span>
          </button>
          <button
            onClick={() => setActiveTab("tarik")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "tarik" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20 font-bold" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Download className="w-4.5 h-4.5" />
            <span>Tarik Imbal Hasil (Pencairan)</span>
          </button>
        </div>
      )}

      {/* CONTENTS AREA */}
      <AnimatePresence mode="wait">
        {/* TAB 1: PORTOFOLIO LOG */}
        {activeTab === "portfolio" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Deploy detail mapping */}
            <div className="bg-[#0F1115] rounded-xl border border-[#262626] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm">
                Alokasi Pendanaan Aktif yang Anda Dukung
              </div>

              {activeFundedInvoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs italic font-mono">
                  Belum ada invoice aktif yang didanai pool saat ini.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#0A0B0D] border-b border-[#262626] text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-4 font-semibold">No Invoice</th>
                        <th className="p-4 font-semibold">Nama Warung Penerima</th>
                        <th className="p-4 font-semibold">Total Pembiayaan Pokok</th>
                        <th className="p-4 font-semibold">Proporsi Modal Anda (Est)</th>
                        <th className="p-4 font-semibold">Status Tagihan</th>
                        <th className="p-4 font-semibold">Imbal Hasil Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-gray-300">
                      {activeFundedInvoices.map(inv => {
                        const warungParty = parties.find(p => p.id === inv.warung_id);
                        const myPropShare = inv.funding_amount * (poolOwnershipShare / 100);

                        return (
                          <tr key={inv.id} className="hover:bg-white/5 transition-colors cursor-default">
                            <td className="p-4 font-mono text-white">{inv.invoice_no}</td>
                            <td className="p-4 font-semibold text-white">{warungParty?.display_name || "Mitra Retail"}</td>
                            <td className="p-4 font-semibold text-gray-300 font-mono">{formatRupiah(inv.funding_amount)}</td>
                            <td className="p-4 font-bold text-emerald-400 font-mono">{formatRupiah(myPropShare)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                inv.status === "ESCROW_LOCKED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                inv.status === "SHIPPED" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                inv.status === "REPAYMENT_ACTIVE" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-emerald-400 font-mono">
                              {formatRupiah(Math.round(inv.funding_amount * 0.035))}
                            </td>
                          </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: POOL TOP-UP */}
        {activeTab === "topup" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0F1115] rounded-xl border border-[#262626] p-6 shadow-md max-w-xl mx-auto space-y-6"
          >
            <div className="border-b border-[#262626] pb-3">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                Top-Up Modal Pool Koperasi
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Lakukan top-up saldo Rupiah untuk menyalurkan modal kerja produktif ke ribuan warung kecil di Bandung.
              </p>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider font-mono">Nominal Top-Up Rupiah (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-gray-500 text-xs font-mono">Rp</span>
                  <input
                    type="text"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(newProdPriceValue(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#1A1D23] border border-[#262626] rounded-lg text-sm font-mono font-bold text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600"
                    placeholder="Contoh: 10.000.000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider font-mono">Metode Pembayaran Instan</label>
                <select
                  value={topUpMethod}
                  onChange={(e) => setTopUpMethod(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1A1D23] border border-[#262626] rounded-lg text-xs text-white outline-none cursor-pointer"
                >
                  <option value="BCA_VA" className="bg-[#1A1D23]">BCA Virtual Account (Auto-Settled)</option>
                  <option value="MANDIRI_VA" className="bg-[#1A1D23]">Mandiri Virtual Account</option>
                  <option value="QRIS" className="bg-[#1A1D23]">QRIS GPN Instan</option>
                </select>
              </div>

              <div className="bg-[#14161C] p-4 rounded-xl space-y-2 border border-[#262626] text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Nominal Deposit:</span>
                  <span className="font-bold text-white font-mono">{formatRupiah(Number(topUpAmount) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Transaksi (VA/QRIS):</span>
                  <span className="font-bold text-emerald-400">Rp 0 (Bebas Biaya)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#262626] font-bold text-white">
                  <span>Total Tagihan Bayar:</span>
                  <span className="font-mono">{formatRupiah(Number(topUpAmount) || 0)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isTopUpProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
              >
                {isTopUpProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran Top-Up</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB 3: INVESTOR WITHDRAWAL */}
        {activeTab === "tarik" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0F1115] rounded-xl border border-[#262626] p-6 shadow-md max-w-xl mx-auto space-y-6"
          >
            <div className="border-b border-[#262626] pb-3">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                Penarikan Dana Imbal Hasil (Withdrawal)
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Tarik imbal hasil atau modal pokok dari wallet platform Anda ke rekening bank perbankan lokal secara aman.
              </p>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider font-mono">Nominal Penarikan Dana (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-gray-500 text-xs font-mono">Rp</span>
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(newProdPriceValue(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#1A1D23] border border-[#262626] rounded-lg text-sm font-mono font-bold text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-gray-600"
                    placeholder="Contoh: 1.000.000"
                    required
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 font-mono">
                  <span>Maksimal penarikan: {formatRupiah(walletBalance)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider font-mono">Bank Tujuan Transfer</label>
                  <select
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1D23] border border-[#262626] rounded-lg text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="BCA" className="bg-[#1A1D23]">BCA (Bank Central Asia)</option>
                    <option value="Mandiri" className="bg-[#1A1D23]">Bank Mandiri</option>
                    <option value="BNI" className="bg-[#1A1D23]">BNI (Bank Negara Indonesia)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider font-mono">Nomor Rekening Tujuan</label>
                  <input
                    type="text"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1D23] border border-[#262626] rounded-lg text-xs font-mono font-bold text-white outline-none"
                    placeholder="Contoh: 0241098218"
                    required
                  />
                </div>
              </div>

              {/* Economic rule calculation (PRD: Flat fee Rp 2500 - Rp 5000) */}
              <div className="bg-[#14161C] p-4 rounded-xl space-y-2 border border-[#262626] text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Nominal Penarikan:</span>
                  <span className="font-bold text-white font-mono">{formatRupiah(Number(withdrawAmount) || 0)}</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Biaya Operasional Flat (Fee WDR):</span>
                  <span className="font-bold">-Rp 5.000</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#262626] font-bold text-emerald-400 text-sm font-mono">
                  <span>Net Bersih Diterima di Rekening:</span>
                  <span>{formatRupiah(Math.max(0, (Number(withdrawAmount) || 0) - 5000))}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isWithdrawProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
              >
                {isWithdrawProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengirim Transaksi...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Kirim Pengajuan Penarikan</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

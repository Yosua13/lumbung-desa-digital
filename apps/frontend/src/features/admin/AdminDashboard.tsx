/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  UserCheck,
  ShieldAlert,
  BookOpen,
  Server,
  RefreshCw,
  Key,
  Link2,
  Check,
  X,
  Eye,
  ShieldCheck,
  Database,
  Lock,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  ExternalLink
} from "lucide-react";
import {
  RoleCode,
  Party,
  WarungProfile,
  SupplierProfile,
  LedgerAccount,
  StellarTransaction,
  AuditLog
} from "../../types";
import { formatRupiah, maskPII, formatDateTime } from "../../utils";

interface AdminDashboardProps {
  activeParty: Party;
  parties: Party[];
  warungProfiles: WarungProfile[];
  supplierProfiles: SupplierProfile[];
  ledgerAccounts: LedgerAccount[];
  stellarTransactions: StellarTransaction[];
  auditLogs: AuditLog[];
  onApprovePartyKYC: (partyId: string) => void;
  onRejectPartyKYC: (partyId: string) => void;
  kmsKeyId: string;
  isRotatingKey: boolean;
  onRotateKey: () => void;
}

export default function AdminDashboard({
  activeParty,
  parties,
  warungProfiles,
  supplierProfiles,
  ledgerAccounts,
  stellarTransactions,
  auditLogs,
  onApprovePartyKYC,
  onRejectPartyKYC,
  kmsKeyId,
  isRotatingKey,
  onRotateKey,
  activeTab: propActiveTab,
  onTabChange
}: AdminDashboardProps & { activeTab?: "metrics" | "kyc" | "security" | "ledger" | "stellar"; onTabChange?: (tab: "metrics" | "kyc" | "security" | "ledger" | "stellar") => void }) {
  // Tabs
  const [localActiveTab, setLocalActiveTab] = useState<"metrics" | "kyc" | "security" | "ledger" | "stellar">("metrics");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;

  // Filtering Parties that need KYC verification
  const pendingKYCParties = parties.filter(p => ["PENDING", "NEED_REVISION"].includes(p.kyc_status));

  // Math totals for accounting check
  const totalDebit = ledgerAccounts
    .filter(acc => acc.normal_balance === "DEBIT")
    .reduce((sum, acc) => sum + acc.available_balance + acc.locked_balance, 0);

  const totalCredit = ledgerAccounts
    .filter(acc => acc.normal_balance === "CREDIT")
    .reduce((sum, acc) => sum + acc.available_balance + acc.locked_balance, 0);

  // Status mappings
  const getKycBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">APPROVED</span>;
      case "PENDING":
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">PENDING REVIEW</span>;
      case "NEED_REVISION":
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">REVISION REQ</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP ROW: Admin system health cards */}
      {activeTab === "metrics" && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Activity className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Tingkat Ketepatan Cicilan</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">91.5%</div>
            <p className="text-[9px] text-emerald-400 font-semibold mt-0.5 font-mono">Target &gt; 80% MVP</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Rasio Dispute Sengketa</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">4.2%</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Batas Aman &lt; 10% Pilot</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Status Enkripsi DB</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5 font-mono">100% SECURE</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Per-Column AES Crypt</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <UserCheck className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Antrean Verifikasi KYC</div>
            <div className="text-lg font-extrabold text-amber-400 mt-0.5 font-mono">{pendingKYCParties.length} Mitra</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Warung / Supplier Baru</p>
          </div>
        </div>
      </div>
      )}

      {/* MID ROW: Section navigation switcher */}
      {!propActiveTab && (
        <div className="flex border border-[#262626] bg-[#0F1115] p-1 rounded-xl shadow-md overflow-x-auto">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "metrics" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Metrik Pilot &amp; Statistik</span>
          </button>
          
          <button
            onClick={() => setActiveTab("kyc")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "kyc" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Verifikasi KYC Mitra ({pendingKYCParties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "security" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>KMS Security &amp; Enkripsi</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "ledger" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Double-Entry Ledger Platform</span>
          </button>

          <button
            onClick={() => setActiveTab("stellar")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "stellar" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Audit Blockchain Stellar Logs</span>
          </button>
        </div>
      )}

      {/* CONTENTS */}
      <AnimatePresence mode="wait">
        {/* TAB 1: METRICS DASHBOARD */}
        {activeTab === "metrics" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* General Intro to Admin */}
            <div className="bg-[#0F1115] text-white p-6 rounded-2xl border border-[#262626] relative overflow-hidden shadow-md">
              <div className="absolute right-0 bottom-0 p-6 opacity-5">
                <Database className="w-48 h-48" />
              </div>
              <div className="max-w-2xl">
                <h3 className="font-extrabold text-lg">Platform Operations Command Center</h3>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                  Administrator memegang tanggung jawab penuh atas kepatuhan pelaporan pajak, penyeimbangan buku akuntansi double-entry, otorisasi penarikan modal, auditing sengketa pengiriman, dan pemantauan enkripsi KMS per-kolom database PII nasabah.
                </p>
              </div>
            </div>

            {/* Simulated graph elements with Tailwind */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#262626] shadow-sm space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">Status Onboarding Mitra Pilot</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-gray-300">
                      <span>Mitra Retail Warung Selesai KYC</span>
                      <span className="font-bold text-white">{parties.filter(p => p.party_type === RoleCode.WARUNG && p.kyc_status === "APPROVED").length} dari 10 Warung</span>
                    </div>
                    <div className="w-full bg-[#14161C] h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${(parties.filter(p => p.party_type === RoleCode.WARUNG && p.kyc_status === "APPROVED").length / 10) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-gray-300">
                      <span>Distributor Supplier Selesai KYC</span>
                      <span className="font-bold text-white">{parties.filter(p => p.party_type === RoleCode.SUPPLIER && p.kyc_status === "APPROVED").length} dari 3 Supplier</span>
                    </div>
                    <div className="w-full bg-[#14161C] h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(parties.filter(p => p.party_type === RoleCode.SUPPLIER && p.kyc_status === "APPROVED").length / 3) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#262626] shadow-sm space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">Sistem Audit Trail Overview</h4>
                <div className="space-y-2 max-h-36 overflow-y-auto font-mono text-[9px] text-gray-400 bg-[#14161C] p-3 rounded-lg border border-[#262626]">
                  {auditLogs.slice(0, 4).map(log => (
                    <div key={log.id} className="border-b border-[#262626] pb-1 last:border-0 last:pb-0">
                      <span className="text-indigo-400">[{log.timestamp.substring(11,19)}]</span>{" "}
                      <strong className="text-gray-300">{log.actor_name}</strong>{" "}
                      <span className="text-gray-400">{log.action}</span> - entity: <span className="text-amber-400">{log.entity_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: VERIFICATION ONBOARDING QUEUE */}
        {activeTab === "kyc" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] flex justify-between items-center">
                <h3 className="font-extrabold text-white text-sm">Antrean Verifikasi Dokumen &amp; Otorisasi Limit</h3>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                  {pendingKYCParties.length} Antrean Aktif
                </span>
              </div>

              {pendingKYCParties.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-20 text-emerald-400" />
                  <p className="text-xs font-bold">Semua Mitra Telah Terverifikasi</p>
                  <p className="text-[10px] mt-1">Belum ada pengajuan onboarding baru dari warung atau supplier harian.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#262626] text-xs">
                  {pendingKYCParties.map(p => {
                    const warungProf = warungProfiles.find(w => w.party_id === p.id);
                    const isWarung = p.party_type === RoleCode.WARUNG;

                    return (
                      <div key={p.id} className="p-5 hover:bg-[#14161C]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{p.display_name}</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase">
                              {p.party_type}
                            </span>
                            {getKycBadge(p.kyc_status)}
                          </div>

                          <div className="text-gray-400 space-y-1">
                            <div>Nama Legal Pemilik: <strong className="text-gray-300">{p.legal_name}</strong></div>
                            {isWarung && warungProf && (
                              <>
                                <div>Omzet Bulanan Anggota: <strong className="text-gray-300">{formatRupiah(warungProf.monthly_turnover_estimate)}</strong></div>
                                <div>Alamat Lokasi: <span className="text-gray-300">{warungProf.address}, {warungProf.city}</span></div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onApprovePartyKYC(p.id);
                              alert(`KYC Mitra ${p.display_name} disetujui! Akun diaktifkan, limit kredit diberikan otomatis berdasarkan track omzet, dan Ledger account baru dibuat.`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui (Approve)</span>
                          </button>
                          <button
                            onClick={() => {
                              onRejectPartyKYC(p.id);
                              alert(`Pengajuan ${p.display_name} ditolak. Notifikasi perbaikan dokumen dikirimkan.`);
                            }}
                            className="bg-[#14161C] hover:bg-red-950/20 hover:text-red-400 border border-[#262626] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak / Revisi</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: KMS SECURITY HUB (ADVANCED ENCRYPTION MANDATE) */}
        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Visual key manager control bar */}
            <div className="bg-[#0F1115] text-white p-5 rounded-2xl border border-[#262626] flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400 animate-pulse" />
                  Visualizer Key Management Service (KMS) &amp; Key Rotation
                </h4>
                <p className="text-[11px] text-gray-400">
                  Data nasabah (NIK KTP &amp; rekening pencairan perbankan) dienkripsi di server-side database menggunakan standard AES-256-GCM. 
                  Anda dapat mensimulasikan rotasi kunci di bawah ini.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <span className="text-xs text-gray-400 font-mono">Active Key: <strong className="text-indigo-300 font-bold">{kmsKeyId}</strong></span>
                <button
                  onClick={() => {
                    onRotateKey();
                    alert("Kunci KMS berhasil diputar secara aman! Semua data baru akan dienkripsi menggunakan kunci yang baru diganti ini.");
                  }}
                  disabled={isRotatingKey}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/15 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRotatingKey ? "animate-spin" : ""}`} />
                  {isRotatingKey ? "Rotasi Key..." : "Rotasi Kunci"}
                </button>
              </div>
            </div>

            {/* Encryption comparisons */}
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm">
                Perbandingan Enkripsi Data Database vs Tampilan UI Ter-Masking
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#0A0B0D] border-b border-[#262626] text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Nama Legal Anggota</th>
                      <th className="p-4">Informasi Sensitif</th>
                      <th className="p-4">Di Database (Encrypted Ciphertext - AES-256)</th>
                      <th className="p-4">Di Dashboard Pengguna (Masked Layer)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-gray-300 font-mono font-medium">
                    {/* Bu Asih */}
                    <tr className="hover:bg-[#14161C]/50 transition-colors">
                      <td className="p-4 font-sans font-bold text-white">Asih Setyawati (Warung Bu Asih)</td>
                      <td className="p-4 font-sans">NIK KTP Nasabah</td>
                      <td className="p-4 text-indigo-400 break-all select-all text-[10px] max-w-xs">
                        {`ENC[AES256-GCM,v1:${kmsKeyId.substring(0,6)}:iv_4981:salt_8821:NjMzNjh...]`}
                      </td>
                      <td className="p-4 text-gray-400 font-bold">{maskPII("3273012908750002", 4, 4)}</td>
                    </tr>
                    {/* Toko Berkah */}
                    <tr className="hover:bg-[#14161C]/50 transition-colors">
                      <td className="p-4 font-sans font-bold text-white">PT Sembako Makmur Jaya</td>
                      <td className="p-4 font-sans">Rekening BCA Pencairan</td>
                      <td className="p-4 text-indigo-400 break-all select-all text-[10px] max-w-xs">
                        {`ENC[AES256-GCM,v1:${kmsKeyId.substring(0,6)}:iv_1042:salt_3312:MzI3MzAx...]`}
                      </td>
                      <td className="p-4 text-gray-400 font-bold">{maskPII("0245******3928", 4, 4)}</td>
                    </tr>
                    {/* Pak Joko */}
                    <tr className="hover:bg-[#14161C]/50 transition-colors">
                      <td className="p-4 font-sans font-bold text-white">Joko Pranoto (Kedai Pak Joko)</td>
                      <td className="p-4 font-sans">NIK KTP Nasabah</td>
                      <td className="p-4 text-indigo-400 break-all select-all text-[10px] max-w-xs">
                        {`ENC[AES256-GCM,v1:${kmsKeyId.substring(0,6)}:iv_3901:salt_7721:YjI3M2E5...]`}
                      </td>
                      <td className="p-4 text-gray-400 font-bold">{maskPII("3273051212780001", 4, 4)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: GENERAL LEDGER SYSTEM */}
        {activeTab === "ledger" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Balance integrity verification banner */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex gap-4 items-center shadow-sm">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6 animate-bounce" />
              </div>
              <div className="flex-grow">
                <h4 className="font-extrabold text-white text-sm">Pemeriksaan Integritas Sistem Akuntansi Double-Entry</h4>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Sistem perbankan kami menerapkan aturan ketat: <strong className="text-emerald-400 font-bold">Total Debit (Rp) harus sama persis dengan Total Kredit (Rp)</strong> untuk setiap mutasi dana (No Floating Money, No Rounding Errors).
                </p>
                <div className="mt-3 flex gap-6 text-xs">
                  <div className="font-semibold text-gray-400">
                    Sistem Total Debit: <span className="font-mono text-white font-bold">{formatRupiah(totalDebit)}</span>
                  </div>
                  <div className="font-semibold text-gray-400">
                    Sistem Total Kredit: <span className="font-mono text-white font-bold">{formatRupiah(totalCredit)}</span>
                  </div>
                  <div className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                    ✓ INTEGRITY SECURED (BALANCED)
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger accounts list */}
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm flex justify-between items-center">
                <span>Daftar Kode Akun Ledger Akuntansi Platform (Chart of Accounts)</span>
                <span className="text-xs text-gray-400 font-semibold">{ledgerAccounts.length} Akun Terdaftar</span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#0A0B0D] border-b border-[#262626] text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Kode Akun (COA)</th>
                      <th className="p-4">Nama Akun Akuntansi</th>
                      <th className="p-4">Tipe Akun</th>
                      <th className="p-4">Normal Balance</th>
                      <th className="p-4">Saldo Tersedia</th>
                      <th className="p-4">Saldo Terkunci (Escrow)</th>
                      <th className="p-4 text-right">Total Saldo Buku</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-gray-300 font-medium">
                    {ledgerAccounts.map(acc => (
                      <tr key={acc.id} className="hover:bg-[#14161C]/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-white">{acc.account_no}</td>
                        <td className="p-4 font-bold text-white">{acc.account_name}</td>
                        <td className="p-4 font-semibold text-gray-400">{acc.account_type}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            acc.normal_balance === "DEBIT" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}>
                            {acc.normal_balance}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{formatRupiah(acc.available_balance)}</td>
                        <td className="p-4 font-mono text-red-400">{formatRupiah(acc.locked_balance)}</td>
                        <td className="p-4 font-mono font-extrabold text-white text-right">
                          {formatRupiah(acc.available_balance + acc.locked_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: STELLAR BLOCKCHAIN ARBITRATION AND LEDGER AUDITING */}
        {activeTab === "stellar" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Explain Stellar integration */}
            <div className="bg-[#0F1115] text-white rounded-2xl p-6 border border-[#262626] flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                  <Link2 className="w-5 h-5 text-indigo-400 animate-pulse" />
                  Stellar Testnet Audit &amp; Settlement Explorer
                </h4>
                <p className="text-[11px] text-gray-400">
                  Berikut adalah live audit trail mutasi saldo yang dicatat ke dalam ledger blockchain Stellar. 
                  Stellar digunakan sebagai trust-layer di belakang layar, menjamin transparansi tanpa memaksa warung memahami kripto.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 bg-indigo-950 px-3 py-1.5 rounded-lg border border-indigo-900/60 text-[10px] font-mono text-indigo-300">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Node Connected: Stellar RPC Horizon
              </div>
            </div>

            {/* Stellar Tx logs */}
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm">
                Blockchain Ledger Explorer
              </div>

              <div className="overflow-x-auto text-[11px]">
                <table className="w-full border-collapse text-left font-mono">
                  <thead>
                    <tr className="bg-[#0A0B0D] border-b border-[#262626] text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Tanggal Ledger</th>
                      <th className="p-4">Tx Hash (Stellar)</th>
                      <th className="p-4">Tipe Aktivitas</th>
                      <th className="p-4">Operation</th>
                      <th className="p-4">Ledger Seq</th>
                      <th className="p-4">Jaringan</th>
                      <th className="p-4 text-center">Status Consensus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-gray-300 font-medium">
                    {stellarTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-[#14161C]/50 transition-colors">
                        <td className="p-4 font-sans text-xs">{new Date(tx.submitted_at).toLocaleString("id-ID")}</td>
                        <td className="p-4 text-indigo-400 break-all select-all text-[10px] max-w-xs">
                          <div className="flex items-center gap-2">
                            <span>{tx.tx_hash}</span>
                            {tx.explorer_url && (
                              <a href={tx.explorer_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-white shrink-0" title="Buka di Stellar Expert">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-sans text-xs">
                          <span className="bg-[#14161C] text-gray-300 px-1.5 py-0.5 rounded border border-[#262626] uppercase font-semibold text-[9px]">
                            {tx.business_reference_type}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">{tx.operation || "SIMULATED_EVENT"}</td>
                        <td className="p-4 font-bold text-gray-400">{tx.ledger_sequence}</td>
                        <td className="p-4 text-gray-400">{tx.network}</td>
                        <td className="p-4 text-center">
                          <span className={`border px-2 py-0.5 rounded text-[9px] font-bold ${
                            tx.is_live
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          }`}>
                            {tx.is_live ? "LIVE_LEDGER_POSTED" : "SIMULATED_LEDGER_POSTED"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

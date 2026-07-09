/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Store,
  ShoppingCart,
  Check,
  Plus,
  Minus,
  Trash2,
  Calendar,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Upload,
  ArrowRight,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Truck,
  CheckCircle,
  Eye,
  Lock,
  MessageSquare
} from "lucide-react";
import {
  RoleCode,
  Party,
  WarungProfile,
  Product,
  Invoice,
  CartItem,
  RepaymentSchedule,
  InvoiceItem
} from "../types";
import { formatRupiah, maskPII, encryptData } from "../utils";

interface WarungDashboardProps {
  activeParty: Party;
  warungProfile: WarungProfile;
  products: Product[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  repaymentSchedules: RepaymentSchedule[];
  onCreateInvoice: (supplierId: string, items: CartItem[], dp: number, tenor: number) => void;
  onConfirmReceipt: (invoiceId: string) => void;
  onPayInstallment: (scheduleId: string) => void;
  onRaiseDispute: (invoiceId: string, reason: string) => void;
  onUpdateKYC: (legalName: string, ownerName: string, address: string, monthlyTurnover: number, ktpNumber: string, kycFile: File | null) => void;
  kmsKeyId: string;
}

export default function WarungDashboard({
  activeParty,
  warungProfile,
  products,
  invoices,
  invoiceItems,
  repaymentSchedules,
  onCreateInvoice,
  onConfirmReceipt,
  onPayInstallment,
  onRaiseDispute,
  onUpdateKYC,
  kmsKeyId,
  activeTab: propActiveTab,
  onTabChange
}: WarungDashboardProps & { activeTab?: "profil" | "katalog" | "tagihan"; onTabChange?: (tab: "profil" | "katalog" | "tagihan") => void }) {
  // Tabs
  const [localActiveTab, setLocalActiveTab] = useState<"profil" | "katalog" | "tagihan">("profil");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;

  // Onboarding States (If KYC is Pending or rejected)
  const [kycLegalName, setKycLegalName] = useState(activeParty.legal_name);
  const [kycOwnerName, setKycOwnerName] = useState(warungProfile?.owner_name || "");
  const [kycAddress, setKycAddress] = useState(warungProfile?.address || "");
  const [kycTurnover, setKycTurnover] = useState(warungProfile?.monthly_turnover_estimate || 15000000);
  const [kycKtp, setKycKtp] = useState("3273012908750002");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [isOnboardingSubmitted, setIsOnboardingSubmitted] = useState(false);

  // Catalog / Shopping Cart states
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDPPercent, setSelectedDPPercent] = useState<number>(20); // default 20%
  const [selectedTenor, setSelectedTenor] = useState<number>(30); // default 30 days

  // Detail View Active Invoice
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Dispute trigger states
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  // Decryption Log States (for visualized advanced encryption)
  const [revealedKtp, setRevealedKtp] = useState(false);
  const [decryptionLog, setDecryptionLog] = useState<string[]>([]);

  // Filtering products
  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Group products by supplier
  const suppliersMap: Record<string, string> = {
    "party-supplier-01": "PT Sembako Makmur Jaya",
    "party-supplier-02": "CV Tirta Segar Nusantara",
    "party-supplier-03": "PT Griya Bersih Abadi"
  };

  // Cart operations
  const addToCart = (product: Product) => {
    // We restrict the cart to a single supplier at a time to prevent complex cross-supplier invoice splits
    if (cart.length > 0 && cart[0].product.supplier_id !== product.supplier_id) {
      alert(`Keranjang belanja Anda saat ini berisi produk dari ${suppliersMap[cart[0].product.supplier_id]}. Untuk memesan dari supplier lain, silakan selesaikan atau kosongkan keranjang belanja Anda terlebih dahulu.`);
      return;
    }
    
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { product, qty: product.minimum_order_qty }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.qty + delta;
        return newQty >= item.product.minimum_order_qty ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Cart math
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.unit_price * item.qty), 0);
  const cartDPValue = Math.round(cartSubtotal * (selectedDPPercent / 100));
  const cartFinancingValue = cartSubtotal - cartDPValue;
  const cartAdminFee = Math.round(cartFinancingValue * 0.03); // 3% flat admin fee
  const cartEstimatedTotalPayment = cartFinancingValue + cartAdminFee;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (cartEstimatedTotalPayment > warungProfile.available_limit) {
      alert("Pengajuan Anda melebihi sisa limit kredit aktif Anda! Silakan kurangi produk di keranjang atau bayar tagihan aktif terlebih dahulu.");
      return;
    }
    
    onCreateInvoice(cart[0].product.supplier_id, cart, cartDPValue, selectedTenor);
    setCart([]);
    setSelectedInvoice(null);
    setActiveTab("tagihan");
    alert("Pengajuan invoice financing berhasil dikirim! Menunggu persetujuan Supplier dan Koperasi.");
  };

  // Encryption logs trigger
  const toggleKtpReveal = () => {
    if (!revealedKtp) {
      const logMsg = `[KMS SECURITY] Decryption request for Warung owner KTP [AES-256-GCM] with key ${kmsKeyId}. Access approved for role ${activeParty.party_type}. IP 182.253.14.88. Timestamp: ${new Date().toISOString()}`;
      setDecryptionLog(prev => [logMsg, ...prev]);
    }
    setRevealedKtp(!revealedKtp);
  };

  // File drop handler for onboarding docs
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setKycFile(e.dataTransfer.files[0]);
    }
  };

  const submitOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateKYC(kycLegalName, kycOwnerName, kycAddress, Number(kycTurnover), kycKtp, kycFile);
    setIsOnboardingSubmitted(true);
    alert("Dokumen onboarding berhasil diunggah! Koperasi dan Admin akan meninjau kelayakan profil Anda dalam waktu maksimal 24 jam.");
  };

  // Filter invoices for this warung
  const myInvoices = invoices.filter(inv => inv.warung_id === activeParty.id);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const maps: Record<string, { label: string, style: string }> = {
      DRAFT: { label: "Draft", style: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
      SUBMITTED: { label: "Menunggu Supplier", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      SUPPLIER_APPROVED: { label: "Disetujui Supplier", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
      COOP_REVIEW: { label: "Review Koperasi", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      FUNDED: { label: "Didanai Pool", style: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
      ESCROW_LOCKED: { label: "Dana Aman (Escrow)", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      SHIPPED: { label: "Barang Dikirim", style: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
      RECEIVED_CONFIRMED: { label: "Barang Diterima", style: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
      PAYOUT_PROCESSING: { label: "Proses Cashout", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse" },
      REPAYMENT_ACTIVE: { label: "Cicilan Aktif", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      COMPLETED: { label: "Lunas", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      OVERDUE: { label: "Overdue (Tunggakan)", style: "bg-red-500/10 text-red-400 border-red-500/20" },
      DISPUTE: { label: "Dispute (Bermasalah)", style: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
      REJECTED: { label: "Ditolak / Refund", style: "bg-red-500/10 text-red-400 border-red-500/20" }
    };
    const info = maps[status] || { label: status, style: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded border ${info.style}`}>{info.label}</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* LEFT COLUMN: Profile and limit hub (Sticky) */}
      <div className="lg:col-span-1 space-y-6">
        {/* Warung Reputation / Trust Score Card */}
        <div className="bg-[#0F1115] rounded-xl p-6 border border-[#262626] shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <Store className="w-5 h-5 text-gray-600" />
          </div>

          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 font-mono">Profil Kredit Warung</h3>

          <div className="flex items-center gap-4 mb-4">
            {/* Visual reputation ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="#262626" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="url(#trustGradient)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - (warungProfile?.trust_score || 0) / 100)}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-extrabold text-white leading-none font-mono">
                  {warungProfile?.trust_score ? warungProfile.trust_score.toFixed(1) : "0"}
                </span>
                <span className="text-[9px] text-gray-500 font-bold uppercase mt-0.5 font-mono">Trust</span>
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-white text-lg leading-tight">{activeParty.display_name}</h4>
              <p className="text-xs text-gray-400 mt-1">{activeParty.legal_name}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${activeParty.kyc_status === "APPROVED" ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`}></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">KYC: {activeParty.kyc_status}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#262626] pt-4 space-y-3.5">
            <div>
              <div className="text-[10px] text-gray-500 font-semibold mb-0.5 font-mono uppercase tracking-wider">Total Limit Pembiayaan</div>
              <div className="text-xl font-extrabold text-white font-mono">{formatRupiah(warungProfile?.limit_amount || 0)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-semibold mb-0.5 font-mono uppercase tracking-wider">Limit Tersedia (Sisa)</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">{formatRupiah(warungProfile?.available_limit || 0)}</div>
              {/* Progress limit bar */}
              {warungProfile?.limit_amount > 0 && (
                <div className="w-full h-1.5 bg-[#1A1D23] rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(warungProfile.available_limit / warungProfile.limit_amount) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-[#262626] text-gray-500 font-mono">
              <span>Omzet Bulanan (Est):</span>
              <span className="font-bold text-white">{formatRupiah(warungProfile?.monthly_turnover_estimate || 0)}</span>
            </div>
          </div>
        </div>

        {/* Encrypted Data Security Visualizer */}
        <div className="bg-[#0F1115] text-white rounded-xl p-5 border border-[#262626] shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">Enkripsi Data KTP (PII)</h4>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
            Sesuai regulasi privasi data perbankan, NIK KTP Anda dienkripsi di database 
            menggunakan algoritma <span className="text-emerald-400 font-mono text-[10px]">AES-256-GCM</span> dengan rotasi kunci KMS.
          </p>

          <div className="bg-[#0A0B0D] p-3 rounded-lg border border-[#262626] mb-3 font-mono text-xs">
            <div className="text-[10px] text-gray-500 mb-1">Encrypted Ciphertext:</div>
            <div className="text-[11px] text-emerald-400 break-all select-all leading-tight">
              {revealedKtp 
                ? `NIK Pemilik: ${activeParty.ktp_number_encrypted || "3273012908750002"} (Asli Terbuka)`
                : `ENC[AES256,v1:${kmsKeyId.substring(0,6)}:iv_4981:salt_8821:NjMzNjg...]`
              }
            </div>
          </div>

          <button
            onClick={toggleKtpReveal}
            className="w-full bg-[#1A1D23] hover:bg-[#1F232B] text-[11px] font-bold py-2 rounded-lg text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            {revealedKtp ? "Sembunyikan NIK" : "Dekripsi via KMS Key"}
          </button>

          {decryptionLog.length > 0 && (
            <div className="mt-4 border-t border-[#262626] pt-3">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1.5 font-mono">Aktivitas Audit Log KMS:</div>
              <div className="max-h-24 overflow-y-auto space-y-1.5 text-[9px] font-mono text-gray-400 bg-[#0A0B0D] p-2 rounded border border-[#262626]">
                {decryptionLog.map((log, i) => (
                  <div key={i} className="leading-snug text-emerald-400/90 border-b border-[#262626] pb-1 last:border-0 last:pb-0">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Core app interactions */}
      <div className="lg:col-span-3 space-y-6">
        {/* Navigation Tabs */}
        {!propActiveTab && (
          <div className="flex border border-[#262626] bg-[#0F1115] p-1 rounded-xl shadow-md">
            <button
              onClick={() => { setActiveTab("profil"); setSelectedInvoice(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "profil" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
              }`}
            >
              <Store className="w-4.5 h-4.5" />
              <span>Dashboard &amp; Onboarding</span>
            </button>
            <button
              onClick={() => { setActiveTab("katalog"); setSelectedInvoice(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "katalog" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
              }`}
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              <span>Pesan Stok Barang</span>
            </button>
            <button
              onClick={() => { setActiveTab("tagihan"); setSelectedInvoice(null); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "tagihan" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
              }`}
            >
              <CreditCard className="w-4.5 h-4.5" />
              <span>Status Invoice &amp; Cicilan</span>
              {myInvoices.filter(inv => ["SUBMITTED", "SHIPPED", "REPAYMENT_ACTIVE"].includes(inv.status)).length > 0 && (
                <span className="bg-emerald-500 h-2 w-2 rounded-full animate-ping"></span>
              )}
            </button>
          </div>
        )}

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {/* TAB 1: PROFIL & ONBOARDING */}
          {activeTab === "profil" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* KYC Status Warning Banner if not Approved */}
              {activeParty.kyc_status !== "APPROVED" && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4 items-start">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-amber-200 text-sm">Onboarding Akun Belum Disetujui</h4>
                    <p className="text-xs text-amber-400 mt-1 leading-relaxed">
                      Status KYC Anda saat ini adalah <span className="font-bold text-amber-300">{activeParty.kyc_status}</span>. Anda tidak dapat mengajukan pembiayaan invoice stok hingga koperasi memverifikasi dan menyetujui data profil serta dokumen pendukung Anda.
                    </p>
                    <div className="mt-3.5 bg-[#14161C] border border-[#262626] p-3 rounded-xl max-w-lg">
                      <h5 className="font-bold text-[11px] text-gray-400 uppercase tracking-wide">Cara Verifikasi Instan:</h5>
                      <p className="text-xs text-gray-300 mt-1">
                        Silakan lengkapi formulir di bawah ini dan unggah foto KTP atau profil warung Anda. Setelah dikirim, beralihlah ke <strong className="text-indigo-400">Role: Koperasi (Curator)</strong> atau <strong className="text-indigo-400">Role: Admin</strong> untuk menyetujui KYC Anda secara instan!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Onboarding Form */}
              {activeParty.kyc_status !== "APPROVED" && (
                <div className="bg-[#0F1115] rounded-2xl p-6 border border-[#262626] shadow-sm">
                  <h3 className="font-extrabold text-white text-base mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-400" />
                    Formulir Onboarding &amp; Verifikasi Profil
                  </h3>

                  <form onSubmit={submitOnboarding} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Legal Sesuai KTP</label>
                        <input
                          type="text"
                          value={kycLegalName}
                          onChange={(e) => setKycLegalName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="Contoh: Asih Setyawati"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Usaha / Warung</label>
                        <input
                          type="text"
                          value={kycOwnerName}
                          onChange={(e) => setKycOwnerName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="Contoh: Warung Bu Asih"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">NIK KTP Pemilik</label>
                        <input
                          type="text"
                          value={kycKtp}
                          onChange={(e) => setKycKtp(e.target.value)}
                          className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                          placeholder="Contoh: 3273012908750002"
                          maxLength={16}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estimasi Omzet Bulanan (Rp)</label>
                        <input
                          type="number"
                          value={kycTurnover}
                          onChange={(e) => setKycTurnover(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="Contoh: 15000000"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Alamat Lengkap Warung</label>
                      <textarea
                        value={kycAddress}
                        onChange={(e) => setKycAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        rows={3}
                        placeholder="Alamat lengkap, jalan, RT/RW, kelurahan, kecamatan..."
                        required
                      />
                    </div>

                    {/* File Drag Drop Upload Component */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Unggah Dokumen Identitas (KTP / Foto Warung)</label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        className="border-2 border-dashed border-[#262626] hover:border-indigo-500/40 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#14161C]"
                      >
                        <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-300">
                          {kycFile ? kycFile.name : "Tarik & Lepas dokumen di sini, atau klik untuk memilih file"}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">Mendukung format JPG, PNG, PDF (Max 5MB)</p>
                        <input
                          type="file"
                          id="file-kyc"
                          className="hidden"
                          onChange={(e) => e.target.files && setKycFile(e.target.files[0])}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("file-kyc")?.click()}
                          className="mt-3 px-3 py-1.5 bg-[#0F1115] border border-[#262626] hover:border-gray-700 rounded-lg text-[11px] font-bold text-gray-300 shadow-sm"
                        >
                          Pilih Dokumen
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                      >
                        <span>Kirim Dokumen Onboarding</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* General Active Summary Panel (for Approved Warung) */}
              {activeParty.kyc_status === "APPROVED" && (
                <div className="space-y-6">
                  {/* Banner / Guide */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                      <Store className="w-48 h-48" />
                    </div>
                    <div className="max-w-xl">
                      <h3 className="font-extrabold text-xl">Selamat Datang Kembali, {activeParty.legal_name}!</h3>
                      <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                        Anda adalah bagian dari pilot komunitas KUD Mandiri Bersama. Anda memiliki limit pembiayaan aktif senilai <span className="font-bold text-indigo-300">{formatRupiah(warungProfile.limit_amount)}</span> untuk berbelanja stok kebutuhan harian langsung dari supplier resmi.
                      </p>
                      
                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => setActiveTab("katalog")}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                        >
                          <span>Pesan Stok Sekarang</span>
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveTab("tagihan")}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                        >
                          <span>Pantau Cicilan</span>
                          <CreditCard className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats and timeline brief */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#262626] flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pengajuan Aktif</div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {myInvoices.filter(inv => ["SUBMITTED", "SUPPLIER_APPROVED", "COOP_REVIEW"].includes(inv.status)).length} Invoice
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#262626] flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Menunggu Pengiriman</div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {myInvoices.filter(inv => ["ESCROW_LOCKED", "SHIPPED"].includes(inv.status)).length} Order
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0F1115] p-5 rounded-2xl border border-[#262626] flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Jumlah Cicilan Terbayar</div>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {repaymentSchedules.filter(sch => sch.status === "PAID" && myInvoices.map(inv => inv.id).includes(sch.invoice_id)).length} Cicilan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profil Kredit Warung & Enkripsi Data KTP Card */}
                  <div className="bg-[#0F1115] rounded-2xl border border-[#262626] p-6 shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#262626]">
                      <div>
                        <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                          <Store className="w-5 h-5 text-emerald-400" />
                          Detail Ringkasan Profil Kredit Warung
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          Kelayakan pembiayaan modal kerja Anda dievaluasi secara dinamis oleh jaringan scoring reputasi koperasi.
                        </p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <ShieldCheck className="w-4 h-4" />
                        AKUN VERIFIKASI (KYC APPROVED)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Part: Credit Parameters */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Metrik &amp; Parameter Finansial</h5>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#14161C] p-4 rounded-xl border border-[#262626]">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-mono">Skor Trust</span>
                            <div className="text-xl font-extrabold text-white mt-1 font-mono">
                              {warungProfile?.trust_score ? warungProfile.trust_score.toFixed(1) : "0"}/100
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              <span className="text-[9px] text-emerald-400 font-bold uppercase font-mono">Reputasi Prima</span>
                            </div>
                          </div>

                          <div className="bg-[#14161C] p-4 rounded-xl border border-[#262626]">
                            <span className="text-[10px] text-gray-500 uppercase font-bold font-mono">Omzet Bulanan (Est)</span>
                            <div className="text-xl font-extrabold text-white mt-1 font-mono">
                              {formatRupiah(warungProfile?.monthly_turnover_estimate || 0)}
                            </div>
                            <div className="mt-1 text-[9px] text-gray-400 font-medium font-sans">
                              Berdasarkan data audit warung
                            </div>
                          </div>
                        </div>

                        {/* Credit limit visual tracking */}
                        <div className="bg-[#14161C] p-4 rounded-xl border border-[#262626] space-y-3">
                          <div className="flex justify-between items-end">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-bold font-mono">Sisa Limit Kredit</span>
                              <div className="text-2xl font-extrabold text-emerald-400 mt-0.5 font-mono">
                                {formatRupiah(warungProfile?.available_limit || 0)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 uppercase font-bold font-mono">Total Limit</span>
                              <div className="text-sm font-extrabold text-white font-mono">
                                {formatRupiah(warungProfile?.limit_amount || 0)}
                              </div>
                            </div>
                          </div>

                          {/* Horizontal progress bar */}
                          {warungProfile?.limit_amount > 0 && (
                            <div>
                              <div className="w-full h-2 bg-[#0F1115] rounded-full overflow-hidden border border-[#262626]">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(warungProfile.available_limit / warungProfile.limit_amount) * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-mono">
                                <span>Terpakai: {formatRupiah(warungProfile.limit_amount - warungProfile.available_limit)}</span>
                                <span>Tersedia: {Math.round((warungProfile.available_limit / warungProfile.limit_amount) * 100)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Part: KMS Encryption Visualizer */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Sistem Perlindungan Privasi Data KTP</h5>
                        
                        <div className="bg-[#14161C] rounded-xl border border-[#262626] p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-indigo-400" />
                            <span className="text-[11px] font-bold text-white uppercase tracking-wide">Skema Enkripsi Sisi Server (KMS)</span>
                          </div>

                          <div className="space-y-2.5 text-xs font-mono">
                            {/* Masked display vs DB raw encryption */}
                            <div className="border-b border-[#262626] pb-2 flex justify-between items-center">
                              <span className="text-gray-500 text-[10px]">Tampilan Masked di UI:</span>
                              <span className="font-bold text-white">{maskPII(activeParty.ktp_number_encrypted || "3273012908750002", 4, 4)}</span>
                            </div>

                            <div className="border-b border-[#262626] pb-2">
                              <div className="text-gray-500 text-[10px] mb-1">Penyimpanan Terenkripsi di Database:</div>
                              <div className="text-[10px] text-indigo-400 break-all select-all leading-tight bg-[#0F1115] p-2 rounded border border-[#262626]">
                                {revealedKtp 
                                  ? `NIK Pemilik: ${activeParty.ktp_number_encrypted || "3273012908750002"} (Asli Terbuka via KMS Decrypt)`
                                  : `ENC[AES256-GCM,v1:${kmsKeyId.substring(0,6)}:iv_4981:salt_8821:NjMzNjg...]`
                                }
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500">Kunci KMS Platform:</span>
                              <span className="font-semibold text-gray-300">{kmsKeyId}</span>
                            </div>

                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500">Algoritma Enkripsi:</span>
                              <span className="font-semibold text-emerald-400">AES-256-GCM (Hardware)</span>
                            </div>
                          </div>

                          {/* Button decryption */}
                          <button
                            onClick={toggleKtpReveal}
                            className="w-full bg-[#0F1115] hover:bg-[#1A1D23] text-xs font-bold py-2 rounded-lg text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {revealedKtp ? "Sembunyikan NIK KTP" : "Dekripsi via KMS Key"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Decryption audit log timeline inside the card */}
                    {decryptionLog.length > 0 && (
                      <div className="border-t border-[#262626] pt-4">
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                          Audit Trail Log Keamanan KMS (Live):
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1.5 text-[10px] font-mono text-gray-400 bg-[#0A0B0D] p-3 rounded-lg border border-[#262626]">
                          {decryptionLog.map((log, i) => (
                            <div key={i} className="leading-relaxed text-emerald-400/90 border-b border-[#262626] pb-1.5 last:border-0 last:pb-0">
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: KATALOG & CART */}
          {activeTab === "katalog" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-8"
            >
              {/* Product Catalog list (Left side of grid) */}
              <div className="xl:col-span-2 space-y-6">
                {/* Category selector filters */}
                <div className="flex gap-2 bg-[#0F1115] p-1 rounded-xl border border-[#262626] overflow-x-auto">
                  {["All", "Sembako", "Minuman", "Rumah Tangga"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                        selectedCategory === cat ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(prod => {
                    const supplierName = suppliersMap[prod.supplier_id] || "Supplier Resmi";
                    const isOutOfStock = prod.stock_status === "OUT_OF_STOCK";
                    const cartItem = cart.find(item => item.product.id === prod.id);

                    return (
                      <div
                        key={prod.id}
                        className={`bg-[#0F1115] rounded-2xl border transition-all overflow-hidden ${
                          isOutOfStock ? "opacity-60 border-[#262626]" : "border-[#262626] hover:border-[#333]"
                        }`}
                      >
                        <div className="flex h-36">
                          {/* Image */}
                          <div className="w-1/3 bg-[#14161C] relative shrink-0">
                            <img
                              src={prod.image_url || "https://images.unsplash.com/photo-1586201375761-83865001e31c"}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              {prod.category}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="w-2/3 p-4 flex flex-col justify-between">
                            <div>
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-1">
                                {supplierName}
                              </div>
                              <h4 className="font-extrabold text-white text-xs line-clamp-2 leading-snug">
                                {prod.name}
                              </h4>
                              <p className="text-[10px] text-gray-400 mt-1">Unit: {prod.unit} • MOQ: {prod.minimum_order_qty}</p>
                            </div>

                            <div className="flex items-center justify-between border-t border-[#262626] pt-2">
                              <span className="font-extrabold text-white text-sm">
                                {formatRupiah(prod.unit_price)}
                              </span>

                              {activeParty.kyc_status !== "APPROVED" ? (
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Need KYC</span>
                              ) : isOutOfStock ? (
                                <span className="text-[10px] font-bold text-red-500 uppercase">Habis</span>
                              ) : (
                                <button
                                  onClick={() => addToCart(prod)}
                                  className={`p-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    cartItem
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-[#1A1D23]"
                                  }`}
                                >
                                  {cartItem ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Tambah ({cartItem.qty})</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Pilih</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shopping Cart Panel (Right side of grid) */}
              <div className="xl:col-span-1">
                <div className="bg-[#0F1115] rounded-2xl border border-[#262626] p-6 sticky top-28 space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-[#262626]">
                    <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <ShoppingCart className="w-4.5 h-4.5 text-indigo-400" />
                      Keranjang Pengajuan Stok
                    </h3>
                    <span className="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {cart.length} Item
                    </span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-bold">Keranjang Belanja Kosong</p>
                      <p className="text-[10px] mt-1">Silakan pilih produk dari katalog di sebelah kiri.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Active Supplier indicator */}
                      <div className="bg-[#14161C] p-3 rounded-xl border border-[#262626] text-[11px] text-gray-300 leading-tight">
                        Pemesanan dari supplier: <strong className="text-white">{suppliersMap[cart[0].product.supplier_id]}</strong>
                      </div>

                      {/* Items List */}
                      <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                        {cart.map(item => (
                          <div key={item.product.id} className="flex justify-between items-center gap-3 bg-[#14161C] p-2.5 rounded-xl border border-[#262626]">
                            <div className="flex-grow">
                              <h5 className="font-bold text-white text-xs leading-snug line-clamp-1">{item.product.name}</h5>
                              <div className="text-[10px] text-gray-400 mt-0.5 flex justify-between items-center">
                                <span>{formatRupiah(item.product.unit_price)} per {item.product.unit}</span>
                                <span className="font-bold text-gray-300">Sub: {formatRupiah(item.product.unit_price * item.qty)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateCartQty(item.product.id, -1)}
                                className="p-1 rounded bg-[#0F1115] hover:bg-[#14161C] border border-[#262626] text-white shadow-sm"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs font-bold text-white w-6 text-center">{item.qty}</span>
                              <button
                                onClick={() => updateCartQty(item.product.id, 1)}
                                className="p-1 rounded bg-[#0F1115] hover:bg-[#14161C] border border-[#262626] text-white shadow-sm"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1 text-gray-400 hover:text-red-500 ml-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* DP / Tenor selectors */}
                      <div className="space-y-4 pt-3 border-t border-[#262626]">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                            <span>Pilih Uang Muka (DP):</span>
                            <span className="text-indigo-400">{selectedDPPercent}% ({formatRupiah(cartDPValue)})</span>
                          </div>
                          {/* preset buttons */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {[0, 10, 20, 30].map(pct => (
                              <button
                                key={pct}
                                onClick={() => setSelectedDPPercent(pct)}
                                className={`py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                  selectedDPPercent === pct
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "bg-[#0F1115] border-[#262626] text-gray-300 hover:bg-[#14161C]"
                                }`}
                              >
                                {pct === 0 ? "0% (No DP)" : `${pct}%`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                            <span>Tenor Cicilan Fleksibel:</span>
                            <span className="text-indigo-400">{selectedTenor} Hari</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[10, 20, 30, 45].map(days => (
                              <button
                                key={days}
                                onClick={() => setSelectedTenor(days)}
                                className={`py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                  selectedTenor === days
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "bg-[#0F1115] border-[#262626] text-gray-300 hover:bg-[#14161C]"
                                }`}
                              >
                                {days} Hari
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-gray-500 mt-1 leading-snug">
                            * Tenor fleksibel divalidasi oleh kebijakan risiko koperasi dan tingkat trust score Anda.
                          </p>
                        </div>
                      </div>

                      {/* Summary Economy Breakdown */}
                      <div className="bg-[#14161C] p-4 rounded-xl space-y-2 border border-[#262626] text-xs">
                        <div className="flex justify-between text-gray-400">
                          <span>Subtotal Belanja:</span>
                          <span className="font-bold text-white">{formatRupiah(cartSubtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Uang Muka (DP):</span>
                          <span className="font-bold text-white">-{formatRupiah(cartDPValue)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Pembiayaan Pokok Pool:</span>
                          <span className="font-bold text-indigo-400">{formatRupiah(cartFinancingValue)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400 pb-1.5 border-b border-[#262626]">
                          <span>Admin Fee Platform (3%):</span>
                          <span className="font-bold text-white">+{formatRupiah(cartAdminFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-1.5">
                          <span className="font-bold text-white">Total Utang Cicilan:</span>
                          <span className="font-extrabold text-white">{formatRupiah(cartEstimatedTotalPayment)}</span>
                        </div>
                      </div>

                      {/* Checkout button */}
                      <button
                        onClick={handleCheckout}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15 transition-all cursor-pointer"
                      >
                        <span>Ajukan Pembiayaan Invoice</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: INVOICE FINANCING LIST & INSTALMENTS */}
          {activeTab === "tagihan" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#262626] flex justify-between items-center bg-[#14161C]">
                  <h3 className="font-extrabold text-white text-sm">
                    Riwayat Invoice Financing &amp; Pembayaran Cicilan
                  </h3>
                  <span className="text-xs text-gray-400 font-semibold">{myInvoices.length} Total Invoice</span>
                </div>

                {myInvoices.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold">Belum Ada Pengajuan Invoice</p>
                    <p className="text-[10px] mt-1">Silakan ajukan pembiayaan baru di tab &quot;Pesan Stok Barang&quot;.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#262626]">
                    {myInvoices.map(inv => {
                      const supplierName = suppliersMap[inv.supplier_id] || "Supplier";
                      const isSelected = selectedInvoice?.id === inv.id;

                      return (
                        <div key={inv.id} className="p-4 hover:bg-[#14161C]/50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-white">{inv.invoice_no}</span>
                                {getStatusBadge(inv.status)}
                              </div>
                              <div className="text-[11px] text-gray-400 flex items-center gap-3">
                                <span>Supplier: <strong className="text-gray-300">{supplierName}</strong></span>
                                <span>Tenor: <strong className="text-gray-300">{inv.tenor_days} Hari</strong></span>
                                <span>Tanggal: <strong className="text-gray-300">{new Date(inv.created_at).toLocaleDateString("id-ID")}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6">
                              <div className="text-right">
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">Total Pembiayaan</div>
                                <div className="text-sm font-extrabold text-white">{formatRupiah(inv.funding_amount)}</div>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedInvoice(isSelected ? null : inv);
                                  setShowDisputeForm(false);
                                }}
                                className="px-3 py-1.5 bg-[#14161C] hover:bg-[#1F232B] rounded-lg text-[11px] font-bold text-gray-300 border border-[#262626] flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <span>{isSelected ? "Tutup Detail" : "Lihat Detail"}</span>
                                <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${isSelected ? "rotate-90" : ""}`} />
                              </button>
                            </div>
                          </div>

                          {/* INVOICE EXPANDED DETAIL HUB */}
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-5 border-t border-[#262626] pt-5 space-y-6 overflow-hidden"
                            >
                              {/* STATUS TIMELINE STEPPER (PRD - Progress Transparency) */}
                              <div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status Pelacakan Transaksi (Stellar Audit Trail)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-8 gap-4 text-center text-[10px] text-gray-400">
                                  {[
                                    { step: "SUBMITTED", label: "Diajukan" },
                                    { step: "SUPPLIER_APPROVED", label: "Selesai Supplier" },
                                    { step: "COOP_REVIEW", label: "Review Koperasi" },
                                    { step: "ESCROW_LOCKED", label: "Dana Dikunci" },
                                    { step: "SHIPPED", label: "Barang Kirim" },
                                    { step: "RECEIVED_CONFIRMED", label: "Diterima" },
                                    { step: "REPAYMENT_ACTIVE", label: "Cicil Aktif" },
                                    { step: "COMPLETED", label: "Lunas" }
                                  ].map((node, i) => {
                                    // simple state logic
                                    const states = ["DRAFT", "SUBMITTED", "SUPPLIER_APPROVED", "COOP_REVIEW", "FUNDED", "ESCROW_LOCKED", "SHIPPED", "RECEIVED_CONFIRMED", "PAYOUT_PROCESSING", "REPAYMENT_ACTIVE", "COMPLETED"];
                                    const currentIndex = states.indexOf(inv.status);
                                    const nodeIndex = states.indexOf(node.step);
                                    const isDone = currentIndex >= nodeIndex && inv.status !== "DISPUTE";
                                    const isCurrent = inv.status === node.step;

                                    return (
                                      <div key={node.step} className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                          isDone 
                                            ? "bg-emerald-600 text-white" 
                                            : isCurrent 
                                              ? "bg-indigo-600 text-white animate-pulse" 
                                              : "bg-[#14161C] text-gray-400 border border-[#262626]"
                                        }`}>
                                          {isDone ? "✓" : i + 1}
                                        </div>
                                        <span className={`mt-1 font-semibold block leading-tight ${isCurrent ? "text-indigo-400 font-extrabold" : isDone ? "text-gray-300" : "text-gray-400"}`}>
                                          {node.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* ACTIONS HUB based on status */}
                              <div className="bg-[#14161C] p-4 rounded-xl border border-[#262626] flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                  <h4 className="font-bold text-white text-xs">Aksi &amp; Status Terkini:</h4>
                                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                                    {inv.status === "SUBMITTED" && "Menunggu Supplier menyetujui pesanan Anda, memeriksa stok barang, dan memicu kalkulasi rate lock."}
                                    {inv.status === "ESCROW_LOCKED" && "Koperasi telah menyetujui pendanaan dan mengunci dana di escrow Soroban. Supplier sedang mempersiapkan pengiriman."}
                                    {inv.status === "SHIPPED" && `Barang telah dikirim oleh Supplier. Resi: ${inv.shipping_resi || "SEDANG_DIPROSES"}. Silakan konfirmasi jika barang sudah sampai.`}
                                    {inv.status === "RECEIVED_CONFIRMED" && "Barang telah diterima. Sistem sedang memproses auto-cashout Rupiah langsung ke rekening supplier."}
                                    {inv.status === "PAYOUT_PROCESSING" && "Platform sedang mencairkan dana escrow via rel Stellar ke bank penampung BCA/Mandiri supplier."}
                                    {inv.status === "REPAYMENT_ACTIVE" && "Barang selesai diterima. Anda saat ini memiliki jadwal cicilan pengembalian modal produktif."}
                                    {inv.status === "COMPLETED" && "LUNAS! Terima kasih telah menjaga reputasi tepat waktu. Skor trust Anda telah ditingkatkan."}
                                    {inv.status === "DISPUTE" && `DISPUTE AKTIF: "${inv.dispute_reason}". Pembayaran otomatis ditangguhkan, koperasi akan menengahi.`}
                                  </p>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                  {/* Confirm delivery action */}
                                  {(inv.status === "SHIPPED" || inv.status === "ESCROW_LOCKED") && (
                                    <button
                                      onClick={() => {
                                        onConfirmReceipt(inv.id);
                                        setSelectedInvoice(null);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      <span>Konfirmasi Terima Barang</span>
                                    </button>
                                  )}

                                  {/* Dispute trigger action */}
                                  {(inv.status === "SHIPPED" || inv.status === "ESCROW_LOCKED") && !showDisputeForm && (
                                    <button
                                      onClick={() => setShowDisputeForm(true)}
                                      className="bg-[#0F1115] hover:bg-[#14161C] border border-[#262626] text-orange-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>Laporkan Masalah (Dispute)</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Dispute form */}
                              {showDisputeForm && (
                                <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl space-y-3">
                                  <h5 className="font-bold text-orange-200 text-xs flex items-center gap-1.5">
                                    <AlertTriangle className="w-4.5 h-4.5" />
                                    Buka Dispute / Klaim Masalah Pengiriman
                                  </h5>
                                  <p className="text-[11px] text-orange-300 leading-relaxed">
                                    Buka dispute jika produk yang dikirim rusak, kurang, atau tidak kunjung sampai. Ini akan membekukan dana di escrow Soroban dan mencegah payout otomatis ke supplier sampai koperasi meninjau bukti.
                                  </p>
                                  <div className="space-y-2">
                                    <textarea
                                      value={disputeReason}
                                      onChange={(e) => setDisputeReason(e.target.value)}
                                      placeholder="Jelaskan masalah secara detail (contoh: 2 karung beras pecah, atau isi sabun cuci piring bocor)..."
                                      className="w-full p-2.5 bg-[#14161C] border border-[#262626] text-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                                      rows={2}
                                      required
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setShowDisputeForm(false)}
                                        className="px-3 py-1.5 bg-[#0F1115] hover:bg-[#14161C] border border-[#262626] rounded-lg text-[11px] font-bold text-gray-400 cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!disputeReason) {
                                            alert("Mohon isi deskripsi masalah terlebih dahulu.");
                                            return;
                                          }
                                          onRaiseDispute(inv.id, disputeReason);
                                          setShowDisputeForm(false);
                                          setSelectedInvoice(null);
                                        }}
                                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>Kirim Laporan Dispute</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Financial Economy details of invoice */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#262626]">
                                {/* Items snapshots */}
                                <div>
                                  <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Item Belanja:</h5>
                                  <div className="bg-[#14161C] rounded-xl p-3 border border-[#262626] space-y-2.5">
                                    {invoiceItems.filter(item => item.invoice_id === inv.id).map(item => (
                                      <div key={item.id} className="flex justify-between items-center text-xs text-gray-300">
                                        <span>{item.product_name_snapshot} <strong className="text-white">x{item.qty}</strong></span>
                                        <span className="font-bold text-gray-300">{formatRupiah(item.line_total)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-[#262626] text-white">
                                      <span>Total Belanja:</span>
                                      <span>{formatRupiah(inv.total_amount)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Installments widget (PRD - Flexible Repayment progress) */}
                                <div>
                                  <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Jadwal Cicilan Fleksibel Anda:</h5>
                                  {inv.status === "REPAYMENT_ACTIVE" || inv.status === "COMPLETED" || inv.status === "OVERDUE" ? (
                                    <div className="space-y-3">
                                      {repaymentSchedules.filter(sch => sch.invoice_id === inv.id).map(sch => (
                                        <div
                                          key={sch.id}
                                          className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                                            sch.status === "PAID"
                                              ? "bg-emerald-500/5 border-emerald-500/20"
                                              : sch.status === "OVERDUE"
                                                ? "bg-red-500/5 border-red-500/20"
                                                : "bg-[#14161C] border border-[#262626]"
                                          }`}
                                        >
                                          <div>
                                            <div className="font-bold text-white">Cicilan Ke-{sch.sequence_no}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">Jatuh Tempo: {sch.due_date}</div>
                                          </div>

                                          <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-300">{formatRupiah(sch.amount_due)}</span>
                                            {sch.status === "PAID" ? (
                                              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Lunas</span>
                                            ) : (
                                              <button
                                                onClick={() => onPayInstallment(sch.id)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded text-[10px] shadow transition-colors cursor-pointer"
                                              >
                                                Bayar Sekarang
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-xs italic bg-[#14161C] p-4 rounded-xl border border-[#262626] text-center">
                                      Cicilan akan aktif setelah Anda mengonfirmasi penerimaan barang dari supplier.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
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
    </div>
  );
}

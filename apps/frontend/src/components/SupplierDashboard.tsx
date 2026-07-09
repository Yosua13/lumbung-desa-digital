/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Truck,
  Plus,
  Check,
  X,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Upload,
  AlertCircle,
  RefreshCw,
  Search,
  Lock
} from "lucide-react";
import {
  RoleCode,
  Party,
  SupplierProfile,
  Product,
  Invoice,
  InvoiceItem,
  Payout
} from "../types";
import { formatRupiah, generateId } from "../utils";

interface SupplierDashboardProps {
  activeParty: Party;
  supplierProfile: SupplierProfile;
  products: Product[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payouts: Payout[];
  onAddProduct: (productData: Omit<Product, "id" | "supplier_id" | "is_active">) => void;
  onUpdateStockStatus: (productId: string, status: "AVAILABLE" | "LIMITED" | "OUT_OF_STOCK") => void;
  onApproveInvoice: (invoiceId: string) => void;
  onRejectInvoice: (invoiceId: string) => void;
  onShipInvoice: (invoiceId: string, resi: string) => void;
}

export default function SupplierDashboard({
  activeParty,
  supplierProfile,
  products,
  invoices,
  invoiceItems,
  payouts,
  onAddProduct,
  onUpdateStockStatus,
  onApproveInvoice,
  onRejectInvoice,
  onShipInvoice,
  activeTab: propActiveTab,
  onTabChange
}: SupplierDashboardProps & { activeTab?: "pesanan" | "katalog" | "payout"; onTabChange?: (tab: "pesanan" | "katalog" | "payout") => void }) {
  // Tabs
  const [localActiveTab, setLocalActiveTab] = useState<"pesanan" | "katalog" | "payout">("pesanan");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;

  // Form states for new product
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCat, setNewProdCat] = useState<"Sembako" | "Minuman" | "Rumah Tangga">("Sembako");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdUnit, setNewProdUnit] = useState("");
  const [newProdMoq, setNewProdMoq] = useState("5");

  // Shipping action states
  const [shippingInvoiceId, setShippingInvoiceId] = useState<string | null>(null);
  const [shippingResi, setShippingResi] = useState("");

  // Detailed modal/expand for invoice
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filter products belonging to this supplier
  const myProducts = products.filter(p => p.supplier_id === activeParty.id);

  // Filter invoices/orders submitted to this supplier
  const myInvoices = invoices.filter(inv => inv.supplier_id === activeParty.id);

  // Filter payouts for this supplier
  const myPayouts = payouts.filter(p => p.supplier_id === activeParty.id);

  // Math totals
  const totalSalesVolume = myPayouts.filter(p => p.status === "SUCCESS").reduce((sum, p) => sum + p.gross_amount, 0);
  const pendingPayouts = myInvoices.filter(inv => ["ESCROW_LOCKED", "SHIPPED", "RECEIVED_CONFIRMED"].includes(inv.status)).reduce((sum, p) => sum + p.funding_amount, 0);
  const totalSuccessFees = myPayouts.filter(p => p.status === "SUCCESS").reduce((sum, p) => sum + p.supplier_fee_amount, 0);

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdUnit) {
      alert("Mohon isi seluruh data produk.");
      return;
    }

    onAddProduct({
      name: newProdName,
      category: newProdCat,
      unit_price: Number(newProdPrice),
      unit: newProdUnit,
      minimum_order_qty: Number(newProdMoq),
      stock_status: "AVAILABLE"
    });

    // Reset Form
    setNewProdName("");
    setNewProdPrice("");
    setNewProdUnit("");
    setNewProdMoq("5");
    setShowAddForm(false);
    alert("Produk baru berhasil ditambahkan ke katalog retail!");
  };

  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingInvoiceId || !shippingResi) return;

    onShipInvoice(shippingInvoiceId, shippingResi);
    setShippingInvoiceId(null);
    setShippingResi("");
    setSelectedInvoice(null);
    alert("Konfirmasi pengiriman berhasil! Resi pengiriman dicatat dalam Stellar audit log, dan warung telah dinotifikasi.");
  };

  return (
    <div className="space-y-6">
      {/* TOP ROW: Supplier metrics summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Volume Penjualan Sukses</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(totalSalesVolume)}</div>
            <p className="text-[9px] text-emerald-400 font-semibold mt-0.5 font-mono">Auto-Cashout Selesai</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg animate-pulse">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Dana Terkunci di Escrow</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(pendingPayouts)}</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Aman di Soroban Contract</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-gray-500/10 text-gray-400 rounded-lg">
            <Package className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Total Item Katalog</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{myProducts.length} Produk</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Sembako &amp; Kebutuhan Cepat Laku</p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-xl p-5 border border-[#262626] shadow-md flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide font-mono">Success Fee Potong</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{formatRupiah(totalSuccessFees)}</div>
            <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Success Fee Platform ({Math.round(supplierProfile.supplier_fee_rate * 1000) / 10}%)</p>
          </div>
        </div>
      </div>

      {/* MID ROW: Dashboard and Action selector tabs */}
      {!propActiveTab && (
        <div className="flex border border-[#262626] bg-[#0F1115] p-1 rounded-xl shadow-md">
          <button
            onClick={() => { setActiveTab("pesanan"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "pesanan" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <ClipboardList className="w-4.5 h-4.5" />
            <span>Fulfillment &amp; Pesanan Masuk</span>
            {myInvoices.filter(inv => ["SUBMITTED", "ESCROW_LOCKED"].includes(inv.status)).length > 0 && (
              <span className="bg-emerald-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full font-mono">
                {myInvoices.filter(inv => ["SUBMITTED", "ESCROW_LOCKED"].includes(inv.status)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("katalog"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "katalog" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Package className="w-4.5 h-4.5" />
            <span>Kelola Stok &amp; Katalog</span>
          </button>
          <button
            onClick={() => { setActiveTab("payout"); setSelectedInvoice(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "payout" ? "bg-[#1A1D23] text-emerald-400 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-[#14161C]"
            }`}
          >
            <Truck className="w-4.5 h-4.5" />
            <span>Laporan Auto-Cashout Rupiah</span>
          </button>
        </div>
      )}

      {/* BOTTOM HUB: Tab contents */}
      <AnimatePresence mode="wait">
        {/* TAB 1: ORDER FULFILLMENT */}
        {activeTab === "pesanan" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden"
          >
            <div className="p-5 border-b border-[#262626] bg-[#14161C] flex justify-between items-center">
              <h3 className="font-extrabold text-white text-sm">Pesanan Sembako Masuk &amp; Invoice Financing</h3>
              <span className="text-xs text-gray-400 font-semibold font-mono">{myInvoices.length} Total Pesanan</span>
            </div>

            {myInvoices.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-20 text-gray-600" />
                <p className="text-xs font-bold text-gray-300">Belum Ada Pesanan Masuk</p>
                <p className="text-[10px] text-gray-500 mt-1">Gunakan role Warung di atas untuk memesan stok harian terlebih dahulu.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1F2127]">
                {myInvoices.map(inv => {
                  const isSelected = selectedInvoice?.id === inv.id;

                  return (
                    <div key={inv.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{inv.invoice_no}</span>
                            <span className="text-[10px] text-gray-400 font-semibold font-mono">• Warung ID: {inv.warung_id.substring(6)}</span>
                            {/* status */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              inv.status === "SUBMITTED" ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" :
                              inv.status === "ESCROW_LOCKED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              inv.status === "SHIPPED" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                              "bg-[#14161C] text-gray-400 border-[#262626]"
                            }`}>
                              {inv.status === "SUBMITTED" ? "MENUNGGU PERSETUJUAN" :
                               inv.status === "ESCROW_LOCKED" ? "DANA ESCROW TERKONFIRMASI" :
                               inv.status === "SHIPPED" ? "BARANG DALAM PENGIRIMAN" :
                               inv.status === "RECEIVED_CONFIRMED" ? "BARANG TELAH DITERIMA" :
                               inv.status === "COMPLETED" ? "LUNAS" : inv.status
                              }
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-gray-400">
                            Estimasi Tenor: <strong className="text-gray-200">{inv.tenor_days} Hari</strong> • 
                            Nilai Invoice: <strong className="text-emerald-400">{formatRupiah(inv.total_amount)}</strong> (DP Warung: {formatRupiah(inv.down_payment_amount)})
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          {/* Invoice Review actions */}
                          {inv.status === "SUBMITTED" && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => onApproveInvoice(inv.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Terima &amp; Quote</span>
                              </button>
                              <button
                                onClick={() => onRejectInvoice(inv.id)}
                                className="bg-[#14161C] hover:bg-red-950/20 text-red-400 border border-[#262626] hover:border-red-500/20 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          )}

                          {/* Shipping execution action (Only if ESCROW_LOCKED, meaning coop funded) */}
                          {inv.status === "ESCROW_LOCKED" && (
                            <button
                              onClick={() => {
                                setShippingInvoiceId(inv.id);
                                setShippingResi("");
                                setSelectedInvoice(inv);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-md shadow-indigo-600/10 transition-all"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Kirim Barang</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedInvoice(isSelected ? null : inv)}
                            className="p-1.5 hover:bg-[#14161C] rounded border border-[#262626]"
                          >
                            <ChevronRight className={`w-4 h-4 transform transition-transform text-gray-400 ${isSelected ? "rotate-90 text-white" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Order Detail Panel */}
                      {isSelected && (
                        <div className="mt-4 bg-[#0A0B0D] p-4 rounded-xl border border-[#262626] space-y-4">
                          {/* Shipping Input Box if active */}
                          {shippingInvoiceId === inv.id && (
                            <div className="bg-[#14161C] p-4 rounded-lg border border-indigo-500/20 space-y-3 shadow-sm">
                              <h4 className="font-extrabold text-xs text-white flex items-center gap-2">
                                <Truck className="w-4 h-4 text-indigo-400 animate-bounce" />
                                Input Resi Pengiriman Barang
                              </h4>
                              <p className="text-[11px] text-gray-400">
                                Dana invoice senilai <strong className="text-gray-200">{formatRupiah(inv.funding_amount)}</strong> telah terbukti terkunci di Soroban smart escrow. Silakan masukkan nomor resi / surat jalan pengiriman fisik di bawah ini untuk memulai pengiriman.
                              </p>
                              <form onSubmit={handleShipSubmit} className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={shippingResi}
                                  onChange={(e) => setShippingResi(e.target.value)}
                                  placeholder="Contoh No Resi / Surat Jalan: SJ-98218-SBY"
                                  className="flex-grow px-3 py-2 bg-[#0A0B0D] border border-[#262626] rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                  required
                                />
                                <button
                                  type="submit"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm"
                                >
                                  Konfirmasi Pengiriman
                                </button>
                              </form>
                            </div>
                          )}

                          {/* Items and economics */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono mb-2">Item Detail Pesanan:</h5>
                              <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626] space-y-2">
                                {invoiceItems.filter(item => item.invoice_id === inv.id).map(item => (
                                  <div key={item.id} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-300">{item.product_name_snapshot} <strong className="text-white">x{item.qty}</strong></span>
                                    <span className="font-bold text-white">{formatRupiah(item.line_total)}</span>
                                  </div>
                                ))}
                                <div className="border-t border-[#262626] pt-2 flex justify-between font-bold text-xs">
                                  <span className="text-gray-400">Total Tagihan:</span>
                                  <span className="text-white">{formatRupiah(inv.total_amount)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Trust information */}
                            <div className="space-y-3 text-xs">
                              <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Informasi Pendanaan &amp; Settlement:</h5>
                              <div className="bg-[#14161C] p-3 rounded-lg border border-[#262626] space-y-2 leading-relaxed">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-gray-400">DP yang Dibayar Warung:</span>
                                  <span className="font-bold text-white">{formatRupiah(inv.down_payment_amount)}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-gray-400">Nilai Pembiayaan Koperasi:</span>
                                  <span className="font-bold text-emerald-400">{formatRupiah(inv.funding_amount)}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-gray-400">Success Fee Distributor:</span>
                                  <span className="font-bold text-red-400">-{formatRupiah(inv.funding_amount * supplierProfile.supplier_fee_rate)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] pt-1.5 border-t border-[#262626] font-bold">
                                  <span className="text-gray-200">Pencairan Bersih Rupiah:</span>
                                  <span className="text-emerald-400">{formatRupiah(inv.funding_amount - (inv.funding_amount * supplierProfile.supplier_fee_rate))}</span>
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
          </motion.div>
        )}

        {/* TAB 2: INVENTORY & CATALOG CATALOG */}
        {activeTab === "katalog" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Create Product Form Trigger */}
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-white text-sm">Daftar Produk Katalog Sembako Resmi Anda</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-[#0F1115] hover:bg-[#14161C] border border-[#262626] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>

            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-[#0F1115] p-5 rounded-2xl border border-[#262626] shadow-md space-y-4 overflow-hidden"
              >
                <h4 className="font-bold text-white text-xs">Form Penambahan Katalog Sembako / Minuman</h4>
                <form onSubmit={handleCreateProductSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Produk Dagangan</label>
                    <input
                      type="text"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="Contoh: Beras SPHP Bulog 5kg"
                      className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kategori</label>
                    <select
                      value={newProdCat}
                      onChange={(e) => setNewProdCat(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="Sembako">Sembako</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Rumah Tangga">Rumah Tangga</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Harga Satuan Rupiah (Rp)</label>
                    <input
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="Contoh: 15000"
                      className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Unit / Kemasan</label>
                    <input
                      type="text"
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      placeholder="Contoh: pcs / karton / kg"
                      className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Minimal Order (MOQ)</label>
                    <input
                      type="number"
                      value={newProdMoq}
                      onChange={(e) => setNewProdMoq(e.target.value)}
                      className="w-full px-3 py-2 bg-[#14161C] border border-[#262626] rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-5 flex justify-end gap-2 pt-2 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-[#262626] bg-[#14161C] rounded-lg text-xs font-bold text-gray-400 hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-sm"
                    >
                      Simpan Produk
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Catalog Grid */}
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-[#14161C] border-b border-[#262626] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Nama Produk</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga Satuan</th>
                      <th className="p-4">Unit Kemasan</th>
                      <th className="p-4">Minimal Order (MOQ)</th>
                      <th className="p-4 text-center">Status Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-gray-300">
                    {myProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 font-medium">
                          Belum ada produk terdaftar. Silakan buat satu sekarang.
                        </td>
                      </tr>
                    ) : (
                      myProducts.map(prod => (
                        <tr key={prod.id} className="hover:bg-[#14161C]/50 transition-colors">
                          <td className="p-4 font-bold text-white flex items-center gap-3">
                            <img
                              src={prod.image_url || "https://images.unsplash.com/photo-1586201375761-83865001e31c"}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover bg-[#14161C]"
                            />
                            <span>{prod.name}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full bg-[#14161C] text-gray-300 text-[10px] font-semibold border border-[#262626]">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-4 font-extrabold text-white">{formatRupiah(prod.unit_price)}</td>
                          <td className="p-4 font-semibold text-gray-400">{prod.unit}</td>
                          <td className="p-4 font-mono font-bold text-gray-400">{prod.minimum_order_qty}</td>
                          <td className="p-4 text-center">
                            <select
                              value={prod.stock_status}
                              onChange={(e) => onUpdateStockStatus(prod.id, e.target.value as any)}
                              className="px-2 py-1 bg-[#14161C] hover:bg-[#1A1D23] border border-[#262626] text-white text-[11px] font-bold rounded-lg outline-none cursor-pointer"
                            >
                              <option value="AVAILABLE">Tersedia (In Stock)</option>
                              <option value="LIMITED">Sisa Terbatas</option>
                              <option value="OUT_OF_STOCK">Habis (Out of Stock)</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: AUTO-CASHOUT SETTLEMENT REPORT */}
        {activeTab === "payout" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Explanatory banner about Stellar behind the scenes */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 flex gap-5 items-start">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shrink-0 shadow-lg shadow-indigo-600/20">
                <Lock className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-100 text-sm">Mekanisme Settlement Stellar Auto-Cashout</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Semua transaksi pencairan distributor dijamin oleh smart contract Soroban di jaringan Stellar. 
                  Ketika warung mengonfirmasi penerimaan barang, dana Rupiah yang dikunci akan dilepaskan, 
                  memicu konfirmasi penarikan otomatis (auto-cashout) ke rekening tujuan distributor Anda 
                  melalui fiat payment partner berizin secara instan.
                </p>
                <div className="mt-4 flex gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Bank Tujuan BCA: <span className="font-mono text-slate-200 font-semibold">{supplierProfile.settlement_account_no_encrypted}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span>Quote Lock:</span>
                    <span className="font-bold text-indigo-300">1.00 USD/IDR Fixed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payouts list */}
            <div className="bg-[#0F1115] rounded-2xl border border-[#262626] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#262626] bg-[#14161C] font-bold text-white text-sm">
                Riwayat Pencairan Rupiah Otomatis
              </div>

              {myPayouts.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-20 animate-spin text-emerald-500" />
                  <p className="text-xs font-bold text-gray-300">Belum Ada Payout Masuk</p>
                  <p className="text-[10px] text-gray-500 mt-1">Gunakan role Warung di atas untuk mengonfirmasi penerimaan barang guna mencairkan dana.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#14161C] border-b border-[#262626] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Tanggal Payout</th>
                        <th className="p-4">ID Referensi Partner</th>
                        <th className="p-4">Invoice No</th>
                        <th className="p-4">Nilai Bruto</th>
                        <th className="p-4">Fee Platform</th>
                        <th className="p-4">Net Terima Rupiah</th>
                        <th className="p-4 text-center">Status Transaksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-gray-300 font-medium">
                      {myPayouts.map(pay => (
                        <tr key={pay.id} className="hover:bg-[#14161C]/50 transition-colors">
                          <td className="p-4 text-gray-400">{new Date(pay.created_at).toLocaleString("id-ID")}</td>
                          <td className="p-4 font-mono text-[10px] text-gray-500">{pay.partner_reference}</td>
                          <td className="p-4 font-semibold text-white">WSC-2026-{pay.id.substring(4,8)}</td>
                          <td className="p-4 font-bold text-gray-200">{formatRupiah(pay.gross_amount)}</td>
                          <td className="p-4 font-bold text-red-400">-{formatRupiah(pay.supplier_fee_amount)}</td>
                          <td className="p-4 font-extrabold text-emerald-400">{formatRupiah(pay.net_amount)}</td>
                          <td className="p-4 text-center">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

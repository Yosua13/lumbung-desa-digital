/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Landmark, 
  Coins, 
  Key, 
  RefreshCw, 
  LogOut, 
  Store, 
  ShoppingCart, 
  CreditCard,
  ClipboardList, 
  Package, 
  Truck, 
  Scale, 
  AlertTriangle, 
  Users, 
  BarChart2, 
  Plus, 
  Download, 
  Wallet,
  Activity, 
  UserCheck, 
  Lock, 
  BookOpen, 
  Link2,
  ChevronRight
} from "lucide-react";
import { RoleCode, Party, Invoice } from "../types";
import { formatRupiah } from "../utils";

interface SidebarProps {
  currentRole: RoleCode;
  activeParty: Party | null;
  walletBalance: number;
  onSelectRole: (role: RoleCode) => void;
  onResetState: () => void;
  kmsKeyId: string;
  isRotatingKey: boolean;
  onRotateKey: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  onSignOut: () => void;
  invoices: Invoice[];
}

export default function Sidebar({
  currentRole,
  activeParty,
  walletBalance,
  onSelectRole,
  onResetState,
  kmsKeyId,
  isRotatingKey,
  onRotateKey,
  activeTab,
  onTabChange,
  onSignOut,
  invoices
}: SidebarProps) {

  // Dynamic menu definitions depending on current role
  const getMenuItems = () => {
    const myInvoices = invoices.filter(inv => activeParty && inv.supplier_id === activeParty.id);
    const warungInvoices = invoices.filter(inv => activeParty && inv.warung_id === activeParty.id);
    const pendingInvoices = invoices.filter(inv => ["SUBMITTED", "SUPPLIER_APPROVED", "COOP_REVIEW"].includes(inv.status));
    const disputeInvoices = invoices.filter(inv => inv.status === "DISPUTE");

    switch (currentRole) {
      case RoleCode.WARUNG:
        return [
          {
            id: "profil",
            label: "Dashboard & Onboarding",
            icon: Store,
            badge: null
          },
          {
            id: "katalog",
            label: "Pesan Stok Barang",
            icon: ShoppingCart,
            badge: null
          },
          {
            id: "tagihan",
            label: "Invoice & Cicilan",
            icon: CreditCard,
            badge: warungInvoices.filter(inv => ["SUBMITTED", "SHIPPED", "REPAYMENT_ACTIVE"].includes(inv.status)).length || null
          }
        ];
      case RoleCode.SUPPLIER:
        return [
          {
            id: "pesanan",
            label: "Pesanan Masuk",
            icon: ClipboardList,
            badge: myInvoices.filter(inv => ["SUBMITTED", "ESCROW_LOCKED"].includes(inv.status)).length || null
          },
          {
            id: "katalog",
            label: "Katalog & Stok",
            icon: Package,
            badge: null
          },
          {
            id: "payout",
            label: "Auto-Cashout Rupiah",
            icon: Truck,
            badge: null
          }
        ];
      case RoleCode.KOPERASI:
        return [
          {
            id: "persetujuan",
            label: "Queue Persetujuan",
            icon: Scale,
            badge: pendingInvoices.length || null
          },
          {
            id: "pool",
            label: "Manajemen Pool KUD",
            icon: Landmark,
            badge: null
          },
          {
            id: "dispute",
            label: "Sengketa / Dispute",
            icon: AlertTriangle,
            badge: disputeInvoices.length || null,
            badgeColor: "bg-red-500 text-white"
          },
          {
            id: "overdue",
            label: "Kolektibilitas Mitra",
            icon: Users,
            badge: null
          }
        ];
      case RoleCode.INVESTOR:
        return [
          {
            id: "portfolio",
            label: "Portofolio Pool",
            icon: BarChart2,
            badge: null
          },
          {
            id: "topup",
            label: "Top-Up Modal Pool",
            icon: Plus,
            badge: null
          },
          {
            id: "tarik",
            label: "Tarik Imbal Hasil",
            icon: Download,
            badge: null
          }
        ];
      case RoleCode.ADMIN:
        return [
          {
            id: "metrics",
            label: "Metrik & KPI",
            icon: Activity,
            badge: null
          },
          {
            id: "kyc",
            label: "Verifikasi KYC",
            icon: UserCheck,
            badge: null
          },
          {
            id: "security",
            label: "KMS Vault AES-256",
            icon: Lock,
            badge: null
          },
          {
            id: "ledger",
            label: "Ledger Double-Entry",
            icon: BookOpen,
            badge: null
          },
          {
            id: "stellar",
            label: "Audit Stellar Node",
            icon: Link2,
            badge: null
          }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-full md:w-72 bg-[#07080A] border-b md:border-b-0 md:border-r border-[#1F2127] flex flex-col justify-between shrink-0 md:h-screen sticky top-0 z-40 p-5 overflow-y-auto selection:bg-emerald-500/20">
      
      {/* Top Brand Block */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[#1A1D23] pb-5">
          <div className="bg-emerald-500 p-2 rounded text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
            <Landmark className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold tracking-tight text-white font-sans">
                WSC Platform
              </span>
              <span className="text-[8px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded font-mono">
                SECURE
              </span>
            </div>
            <p className="text-[9px] text-gray-500 font-mono tracking-wide mt-0.5">
              STELLAR PILOT SYSTEM
            </p>
          </div>
        </div>

        {/* Dynamic User Profile Card */}
        {activeParty && (
          <div className="bg-[#0F1115] border border-[#1F2127] rounded-xl p-3.5 space-y-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={activeParty.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"}
                  alt={activeParty.display_name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-[#262626]"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#0F1115] text-[7px] font-bold text-black">
                  ✓
                </span>
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs text-white truncate">{activeParty.display_name}</div>
                <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-mono mt-0.5">
                  Role: {currentRole}
                </div>
              </div>
            </div>

            <div className="bg-[#07080A] rounded-lg p-2.5 flex justify-between items-center border border-[#1A1D23]">
              <div className="text-[9px] text-gray-500 font-bold font-mono">SALDO WALLET</div>
              <div className="text-xs font-black text-amber-400 font-mono">
                {formatRupiah(walletBalance)}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono pl-2 mb-2">
            Navigasi Menu
          </div>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/20"
                      : "text-gray-400 hover:text-white hover:bg-[#0F1115]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-gray-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold font-mono shrink-0 ${
                      item.badgeColor || "bg-emerald-500 text-black"
                    }`}>
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Simulator Console Panel */}
      <div className="pt-6 border-t border-[#1A1D23] mt-8 space-y-4">
        
        {/* Role Selection Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono pl-1">
            Ganti Peran Simulasi:
          </label>
          <select
            value={currentRole}
            onChange={(e) => onSelectRole(e.target.value as RoleCode)}
            className="w-full bg-[#0F1115] hover:bg-[#16181D] border border-[#1F2127] hover:border-emerald-500/30 text-xs font-bold rounded-lg px-3 py-2.5 text-white outline-none cursor-pointer transition-all font-mono"
          >
            <option value={RoleCode.WARUNG}>Role: Warung (Retail)</option>
            <option value={RoleCode.SUPPLIER}>Role: Supplier (Distributor)</option>
            <option value={RoleCode.KOPERASI}>Role: Koperasi (Curator)</option>
            <option value={RoleCode.INVESTOR}>Role: Investor (Funder)</option>
            <option value={RoleCode.ADMIN}>Role: Admin (Auditor)</option>
          </select>
        </div>

        {/* KMS Security Key Rotation Widget */}
        <div className="bg-[#0F1115] border border-[#1F2127] rounded-xl p-3 space-y-2 text-[10px]">
          <div className="flex items-center justify-between text-gray-400 font-mono text-[9px]">
            <span>KMS STATUS:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping"></span>
              SECURE
            </span>
          </div>
          <div className="truncate text-gray-400 font-mono text-[9px]">
            Key: <span className="text-emerald-400 font-bold">{kmsKeyId}</span>
          </div>
          <button
            onClick={onRotateKey}
            disabled={isRotatingKey}
            className={`w-full py-1.5 rounded-lg border text-[9px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
              isRotatingKey
                ? "bg-emerald-500/5 text-gray-500 border-gray-800 cursor-not-allowed"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isRotatingKey ? "animate-spin" : ""}`} />
            {isRotatingKey ? "Memutar Key..." : "Putar Kunci Enkripsi"}
          </button>
        </div>

        {/* System Operations Area */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onResetState}
            className="py-2 px-2.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-900/10 hover:border-red-500/20 font-bold text-[10px] text-center font-mono transition-all flex items-center justify-center gap-1"
            title="Seka seluruh data kembali ke setelan awal"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Data
          </button>
          
          <button
            onClick={onSignOut}
            className="py-2 px-2.5 rounded-lg bg-[#0F1115] hover:bg-red-950/20 text-gray-400 hover:text-red-400 border border-[#1F2127] hover:border-red-950/50 font-bold text-[10px] text-center font-mono transition-all flex items-center justify-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>

        <div className="text-[8px] text-gray-600 font-mono text-center">
          Penyelesaian Stellar disimulasikan • v1.0
        </div>
      </div>
    </aside>
  );
}

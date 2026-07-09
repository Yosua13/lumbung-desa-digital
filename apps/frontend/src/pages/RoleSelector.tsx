/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Store, Truck, Landmark, Wallet, ShieldAlert, CheckCircle2 } from "lucide-react";
import { RoleCode } from "../types";

interface RoleSelectorProps {
  currentRole: RoleCode;
  onSelectRole: (role: RoleCode) => void;
  userEmail: string;
}

const ROLES_INFO = [
  {
    code: RoleCode.WARUNG,
    title: "Pemilik Warung (Demand)",
    description: "Ajukan pembiayaan stok sembako & minuman tanpa jaminan tunai. Bayar cicilan fleksibel.",
    icon: Store,
    color: "from-blue-500 to-indigo-600",
    badge: "Mitra Retail",
    features: ["Katalog Sembako", "Pengajuan Tenor", "Konfirmasi Terima", "Bayar Cicilan"]
  },
  {
    code: RoleCode.SUPPLIER,
    title: "Supplier Sembako (Supply)",
    description: "Terima pesanan terjamin, kirim barang aman, dan nikmati pencairan Rupiah otomatis (auto-cashout).",
    icon: Truck,
    color: "from-emerald-500 to-teal-600",
    badge: "Distributor",
    features: ["Kelola Produk", "Persetujuan Order", "Input Resi Kirim", "Auto-Cashout Rupiah"]
  },
  {
    code: RoleCode.KOPERASI,
    title: "Koperasi Unit Desa (Curator)",
    description: "Kurasi risiko anggota warung, kelola pool pendanaan, dan setujui invoice financing aman.",
    icon: Landmark,
    color: "from-amber-500 to-orange-600",
    badge: "Pengelola Risiko",
    features: ["Kurasi Risiko", "Persetujuan Dana", "Penyelesaian Dispute", "Kelola Pool"]
  },
  {
    code: RoleCode.INVESTOR,
    title: "Investor Pendana (Funder)",
    description: "Mendanai aktivitas produktif UMKM warung melalui pool koperasi. Lihat performa & kelola saldo.",
    icon: Wallet,
    color: "from-purple-500 to-pink-600",
    badge: "Dampak Sosial",
    features: ["Kontribusi Pool", "Estimasi Yield", "Penarikan Dana", "Laporan Transparan"]
  },
  {
    code: RoleCode.ADMIN,
    title: "Platform Admin & Auditing",
    description: "Pantau sistem keuangan double-entry ledger, enkripsi data KMS tingkat lanjut, dan audit Stellar.",
    icon: ShieldAlert,
    color: "from-slate-700 to-slate-900",
    badge: "Keamanan Sistem",
    features: ["Audit Ledger", "Pemantauan Stellar", "Enkripsi KMS", "Verifikasi KYC"]
  }
];

export default function RoleSelector({ currentRole, onSelectRole, userEmail }: RoleSelectorProps) {
  return (
    <div className="py-8">
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Pilot Hackathon MVP - Juli 2026
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-white md:text-5xl"
        >
          Warung Supplier <span className="text-emerald-500">Credit</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-lg text-gray-300"
        >
          Simulasi end-to-end pendanaan invoice stok warung. Rupiah-facing untuk pengguna, 
          diselesaikan dengan transparansi <span className="font-semibold text-emerald-400">Stellar Network</span> di belakang layar.
        </motion.p>
        
        <p className="mt-2 text-xs text-gray-500 font-mono">
          Masuk sebagai: <span className="font-semibold text-gray-400">{userEmail}</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center md:text-left">
          PILIH ROLE UNTUK MENSIMULASIKAN JOURNEY
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {ROLES_INFO.map((role, idx) => {
            const IconComponent = role.icon;
            const isSelected = currentRole === role.code;
            
            // Extract core colors for icon container based on role
            let iconBgClass = "bg-amber-500/10 text-amber-500";
            if (role.code === RoleCode.SUPPLIER) iconBgClass = "bg-blue-500/10 text-blue-500";
            else if (role.code === RoleCode.KOPERASI) iconBgClass = "bg-emerald-500/10 text-emerald-500";
            else if (role.code === RoleCode.INVESTOR) iconBgClass = "bg-purple-500/10 text-purple-500";
            else if (role.code === RoleCode.ADMIN) iconBgClass = "bg-red-500/10 text-red-500";

            return (
              <motion.button
                key={role.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => onSelectRole(role.code)}
                id={`role-card-${role.code.toLowerCase()}`}
                className={`relative flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 bg-[#0F1115] ${
                  isSelected 
                    ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20" 
                    : "border-[#262626] hover:border-emerald-500/50 hover:shadow-md"
                }`}
              >
                {/* Visual Header Icon */}
                <div className={`p-3 rounded-xl ${iconBgClass} w-fit mb-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                {/* Role Badge */}
                <div className="mb-2">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#1A1D23] text-gray-300 border border-[#333]">
                    {role.badge}
                  </span>
                </div>
                
                {/* Role Title */}
                <h3 className={`text-base font-bold mb-2 leading-snug ${isSelected ? "text-emerald-400" : "text-white"}`}>
                  {role.title}
                </h3>
                
                {/* Role Description */}
                <p className="text-xs text-gray-400 leading-relaxed mb-4 flex-grow">
                  {role.description}
                </p>
                
                {/* Key Features List */}
                <div className="border-t border-[#262626] pt-3 mt-auto w-full">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Fitur Utama:
                  </div>
                  <ul className="space-y-1.5">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Selected Status Accent */}
                {isSelected && (
                  <span className="absolute top-4 right-4 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-100"></span>
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Key, Link2, RefreshCw, Landmark, Coins, LogOut, CheckCircle } from "lucide-react";
import { RoleCode, Party } from "../types";
import { formatRupiah, maskPII } from "../utils";

interface HeaderProps {
  currentRole: RoleCode;
  activeParty: Party | null;
  walletBalance: number;
  onSelectRole: (role: RoleCode) => void;
  onResetState: () => void;
  kmsKeyId: string;
  isRotatingKey: boolean;
  onRotateKey: () => void;
}

export default function Header({
  currentRole,
  activeParty,
  walletBalance,
  onSelectRole,
  onResetState,
  kmsKeyId,
  isRotatingKey,
  onRotateKey
}: HeaderProps) {
  return (
    <header className="bg-[#0F1115] text-white border-b border-[#262626] sticky top-0 z-50">
      {/* Encryption & Security Banner */}
      <div className="bg-[#0A0B0D] px-4 py-2 border-b border-[#262626] flex flex-wrap justify-between items-center text-xs gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-gray-300">
            Sistem Manajemen Data Terintegrasi Enkripsi Tingkat Lanjut (AES-256-GCM)
          </span>
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE SECURE
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Key Rotation Indicator */}
          <div className="flex items-center gap-2 text-gray-400">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>KMS Key ID: <span className="font-mono text-[10px] text-emerald-400 font-semibold">{kmsKeyId}</span></span>
            <button
              onClick={onRotateKey}
              disabled={isRotatingKey}
              className={`ml-1 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all ${
                isRotatingKey ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isRotatingKey ? "animate-spin" : ""}`} />
              {isRotatingKey ? "Rotasi..." : "Rotasi Key"}
            </button>
          </div>

          {/* Blockchain Node Status */}
          <div className="flex items-center gap-1.5 text-gray-400">
            <Link2 className="w-3.5 h-3.5 text-gray-500 animate-pulse" />
            <span>Settlement:</span>
            <span className="font-semibold text-gray-200 flex items-center gap-1 font-mono text-[11px]">
              Stellar Testnet
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2.5 rounded text-black flex items-center justify-center">
            <Landmark className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">
                WSC Platform <span className="text-emerald-500 font-mono text-xs opacity-80">SECURE_ROOT</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 rounded font-mono">
                MVP
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              Warung Supplier Credit • Stellar Settlement System
            </p>
          </div>
        </div>

        {/* Current Active User Dashboard Info */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {activeParty && (
            <div className="flex items-center gap-3 bg-[#1A1D23] px-3 py-1.5 rounded-full border border-[#333] text-xs">
              <div className="relative">
                <img
                  src={activeParty.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"}
                  alt={activeParty.display_name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-[#262626]"
                />
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border border-slate-900 text-[8px] font-bold text-black">
                  ✓
                </span>
              </div>
              <div>
                <div className="font-bold text-gray-200">{activeParty.display_name}</div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span>Wallet: <span className="font-mono text-amber-300 font-semibold">{formatRupiah(walletBalance)}</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Role Switcher Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 hidden lg:inline font-mono">Ganti Peran:</span>
            <select
              value={currentRole}
              onChange={(e) => onSelectRole(e.target.value as RoleCode)}
              className="bg-[#1A1D23] hover:bg-[#22252C] border border-[#333] hover:border-emerald-500/50 text-xs font-semibold rounded-lg px-3 py-2 text-white outline-none cursor-pointer transition-all"
            >
              <option value={RoleCode.WARUNG}>Role: Warung (Retail)</option>
              <option value={RoleCode.SUPPLIER}>Role: Supplier (Distributor)</option>
              <option value={RoleCode.KOPERASI}>Role: Koperasi (Curator)</option>
              <option value={RoleCode.INVESTOR}>Role: Investor (Funder)</option>
              <option value={RoleCode.ADMIN}>Role: Admin (Auditor)</option>
            </select>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onResetState}
            id="btn-reset-demo"
            className="bg-[#1A1D23] hover:bg-red-950/30 border border-[#333] hover:border-red-900/40 text-xs font-semibold rounded-lg p-2 text-gray-400 hover:text-red-400 transition-all flex items-center justify-center gap-1.5"
            title="Reset Data Simulasi"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}

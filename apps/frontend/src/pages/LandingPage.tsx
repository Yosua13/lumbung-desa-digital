/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { 
  Landmark, 
  ArrowRight, 
  ShieldCheck, 
  Link2, 
  Cpu, 
  BookOpen, 
  Layers, 
  Users, 
  ChevronRight, 
  Coins, 
  Lock, 
  Truck, 
  Award,
  Terminal,
  HelpCircle
} from "lucide-react";

interface LandingPageProps {
  onSignIn: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<"stellar" | "kms" | "doubleEntry" | "trustScore">("stellar");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Interactive step-by-step ecosystem flow states
  const [activeFlowStep, setActiveFlowStep] = useState<number>(0);

  const FLOW_STEPS = [
    {
      title: "1. Pemesanan & DP",
      role: "WARUNG",
      desc: "Pemilik warung memilih stok produk di katalog supplier, membayar Down Payment (DP) sebesar 10-20% lewat dompet digital, dan mengajukan sisa pembiayaan (tenor 10-30 hari).",
      accent: "border-blue-500/30 text-blue-400 bg-blue-500/5"
    },
    {
      title: "2. Peninjauan & Escrow",
      role: "KOPERASI",
      desc: "Koperasi Unit Desa menguji kelayakan warung secara instan berdasarkan Trust Score berbasis historis. Setelah disetujui, dana pendanaan dari Pool dialokasikan dan dikunci secara aman di Soroban Escrow Contract.",
      accent: "border-amber-500/30 text-amber-400 bg-amber-500/5"
    },
    {
      title: "3. Pengiriman Logistik",
      role: "SUPPLIER",
      desc: "Supplier menerima notifikasi pesanan terjamin, memproses stok, menyerahkan ke kurir logistik, dan mengunggah nomor resi pengiriman valid ke platform WSC.",
      accent: "border-purple-500/30 text-purple-400 bg-purple-500/5"
    },
    {
      title: "4. Penerimaan & Auto-Cashout",
      role: "STELLAR ESCROW",
      desc: "Begitu barang sampai, pemilik warung mengonfirmasi penerimaan. Kontrak pintar Stellar secara otomatis mencairkan dana dari Escrow Pool langsung ke dompet supplier dalam waktu hitungan detik tanpa perantara manual.",
      accent: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
    },
    {
      title: "5. Cicilan Fleksibel & Yield",
      role: "WARUNG & INVESTOR",
      desc: "Pemilik warung membayar cicilan secara berkala ke Koperasi. Dana yang terkumpul beserta bunga dialokasikan kembali ke Koperasi dan Investor Pendana sebagai imbal hasil (yield) sosial-ekonomi.",
      accent: "border-teal-500/30 text-teal-400 bg-teal-500/5"
    }
  ];

  return (
    <div className="min-h-screen bg-[#07080A] text-[#E0E0E0] selection:bg-emerald-500/30 selection:text-white overflow-hidden relative">
      {/* Decorative ambient background grid & gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#14161C_1px,transparent_1px),linear-gradient(to_bottom,#14161C_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>
      
      {/* Glowing background blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[800px] right-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Stellar Constellation SVG Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Constellation lines */}
          <line x1="8%" y1="12%" x2="22%" y2="22%" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="22%" y1="22%" x2="16%" y2="42%" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
          <line x1="16%" y1="42%" x2="32%" y2="58%" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="32%" y1="58%" x2="48%" y2="48%" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
          
          <line x1="78%" y1="8%" x2="88%" y2="28%" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1" strokeDasharray="5 5" />
          <line x1="88%" y1="28%" x2="72%" y2="48%" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="1" />
          <line x1="72%" y1="48%" x2="92%" y2="72%" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Stars */}
          <circle cx="8%" cy="12%" r="2" fill="#10B981" opacity="0.6" className="animate-pulse" />
          <circle cx="22%" cy="22%" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="16%" cy="42%" r="2" fill="#3B82F6" opacity="0.7" />
          <circle cx="32%" cy="58%" r="3" fill="#10B981" opacity="0.8" className="animate-pulse" />
          <circle cx="48%" cy="48%" r="1.5" fill="#ffffff" opacity="0.5" />
          <circle cx="78%" cy="8%" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="88%" cy="28%" r="2" fill="#3B82F6" opacity="0.6" />
          <circle cx="72%" cy="48%" r="3" fill="#10B981" opacity="0.7" className="animate-pulse" />
          <circle cx="92%" cy="72%" r="2" fill="#ffffff" opacity="0.9" />
          
          {/* Subtle celestial orbit rings */}
          <circle cx="50%" cy="20%" r="380" stroke="rgba(16, 185, 129, 0.025)" strokeWidth="1.5" fill="none" />
          <circle cx="50%" cy="20%" r="580" stroke="rgba(59, 130, 246, 0.02)" strokeWidth="1.2" strokeDasharray="8 8" fill="none" />
        </svg>
      </div>

      {/* Top Static Nav Bar (Premium Minimalist) */}
      <header className="relative z-10 border-b border-[#1A1D23] bg-[#07080A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Landmark className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-md font-bold tracking-tight text-white font-sans">
                  WSC Platform <span className="text-emerald-500 font-mono text-[10px] opacity-80">v1.0-MVP</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                  SECURE PILOT
                </span>
              </div>
              <p className="text-[9px] text-gray-500 font-mono tracking-wider">
                WARUNG SUPPLIER CREDIT • STELLAR BLOCKCHAIN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#cara-kerja" className="text-xs font-semibold text-gray-400 hover:text-white transition-all">
              Cara Kerja
            </a>
            <a href="#dokumentasi" className="text-xs font-semibold text-gray-400 hover:text-white transition-all">
              Teknologi
            </a>
            <button
              onClick={onSignIn}
              className="bg-[#10B981] hover:bg-[#059669] text-black font-extrabold text-xs px-5 py-2.5 rounded-lg transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
            >
              Sign In ke Platform
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Content Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 text-center md:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mx-auto md:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Penyelesaian Kredit Stok Retail via Soroban Smart Contract
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
              Rel Likuiditas <br className="hidden md:block"/>
              Terdesentralisasi untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Stok Warung</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl font-sans">
              WSC Platform mengotomatisasi pembiayaan faktur belanja warung sembako. Aman bagi koperasi, terjamin bagi supplier lewat escrow, transparan bagi investor pendana, diselesaikan dalam hitungan detik menggunakan <span className="text-emerald-400 font-semibold">Stellar Blockchain</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
              <button
                onClick={onSignIn}
                className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-black font-extrabold text-sm px-8 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
              >
                Mulai Simulasi Multi-Role
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <a
                href="#cara-kerja"
                className="w-full sm:w-auto text-center border border-[#262626] bg-[#0F1115]/80 hover:bg-[#16181D] hover:text-white text-gray-300 font-bold text-sm px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Pelajari Alur Alokasi
              </a>
            </div>

            {/* Quick Metrics Badge Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-[#1A1D23]">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Tingkat Cicilan Tepat</p>
                <p className="text-xl font-black text-white font-mono mt-0.5">91.5%</p>
                <span className="text-[9px] text-emerald-400 font-mono">Meningkat vs Q1</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Kecepatan Payout</p>
                <p className="text-xl font-black text-white font-mono mt-0.5">~5 Detik</p>
                <span className="text-[9px] text-emerald-400 font-mono">Stellar Soroban</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Audit Transparansi</p>
                <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">Double-Entry</p>
                <span className="text-[9px] text-gray-500 font-mono">Real-time Ledger</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Enkripsi Identitas</p>
                <p className="text-xl font-black text-white font-mono mt-0.5">AES-256</p>
                <span className="text-[9px] text-emerald-400 font-mono">KMS Vault Active</span>
              </div>
            </div>
          </div>

          {/* Visual Showcase - Bento Grid Mockup / Code terminal */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/10 rounded-2xl blur opacity-75 pointer-events-none"></div>
            
            {/* Real terminal-style preview */}
            <div className="relative bg-[#0F1115] border border-[#262626] rounded-2xl p-5 shadow-2xl font-mono text-[11px] leading-relaxed text-gray-300">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/70 inline-block"></span>
                  <span className="text-[10px] text-gray-500 ml-2">wsc-soroban-node @ Stellar</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">ONLINE</span>
              </div>

              <div className="space-y-2.5">
                <p className="text-gray-500">{"// Inisialisasi Stellar Escrow Contract"}</p>
                <p><span className="text-purple-400">const</span> contract = <span className="text-blue-400">new</span> <span className="text-amber-400">SorobanEscrow</span>(<span className="text-emerald-400">"C_WSC_POOL_01"</span>);</p>
                
                <div className="p-3 bg-[#07080A] rounded-xl border border-[#1A1D23] space-y-1.5 my-3">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">METODE CONTRACT:</span>
                    <span className="text-amber-400 font-bold">lock_funding()</span>
                  </div>
                  <p className="text-gray-400 text-[10px] leading-relaxed">
                    Mengunci sisa tagihan belanja Warung di escrow. Menjamin hak penarikan dana Supplier begitu tanda terima barang terkirim ke blockchain.
                  </p>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Keamanan Terenkripsi KMS &amp; Disegel Stellar</span>
                  </div>
                </div>

                <p className="text-gray-500">{"// Log Peristiwa Ledger Terakhir"}</p>
                <div className="space-y-1 text-[10px]">
                  <p className="text-gray-400"><span className="text-emerald-400">[OK]</span> TX: <span className="text-blue-400">C6B9..82D3</span> sequence: 1324089</p>
                  <p className="text-gray-400"><span className="text-emerald-400">[OK]</span> Smart Contract: <span className="text-amber-400">FundLocked</span> Rp 3.500.000</p>
                  <p className="text-gray-400"><span className="text-emerald-400">[OK]</span> KMS Decryption: NIK Enkripsi <span className="text-purple-400">AES-256-GCM</span></p>
                </div>

                {/* Simulated Visual Widget of Active Contract */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[#16181D] to-[#0A0B0D] border border-emerald-500/10 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status Kontrak Escrow</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <div className="flex justify-between text-xs font-sans">
                    <div>
                      <div className="text-gray-500 text-[9px] font-mono">NILAI ESCROW</div>
                      <div className="font-extrabold text-white">Rp 2.450.000</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 text-[9px] font-mono">DEPOSIT WARUNG (DP)</div>
                      <div className="font-extrabold text-emerald-400">Rp 550.000 (20%)</div>
                    </div>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full bg-[#1A1D23] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-500 font-mono">
                    <span>DP TERBAYAR</span>
                    <span>DANA POOL KOPERASI (80%) DIKUNCI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Step-by-Step Flow Chart ("Cara Kerja Ekosistem") */}
      <section id="cara-kerja" className="relative z-10 border-t border-[#1A1D23] bg-[#0A0B0D] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase font-mono">SINKRONISASI ALUR KERJA</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Bagaimana Dana &amp; Logistik Mengalir?</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Ekosistem WSC menggabungkan alur fisik logistik sembako dengan alur keuangan berbasis blockchain. Klik langkah di bawah untuk memahami mekanismenya secara dinamis.
            </p>
          </div>

          {/* Interactive Flow Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left selector cards */}
            <div className="lg:col-span-5 space-y-4">
              {FLOW_STEPS.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFlowStep(idx)}
                  className={`w-full text-left p-4.5 rounded-xl border transition-all flex gap-4 ${
                    activeFlowStep === idx 
                      ? "border-emerald-500 bg-emerald-500/5 shadow-[0_4px_12px_rgba(16,185,129,0.05)]" 
                      : "border-[#1A1D23] bg-[#0F1115] hover:border-[#333]"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                    activeFlowStep === idx ? "bg-emerald-500 text-black" : "bg-[#1A1D23] text-gray-400"
                  }`}>
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className={`text-xs font-extrabold uppercase tracking-wide mb-1 ${activeFlowStep === idx ? "text-emerald-400" : "text-gray-300"}`}>
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 line-clamp-1">
                      {step.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right details box */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-[#0F1115] border border-[#262626] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[9px] font-mono text-gray-500">DIGITAL DIGITAL TWIN SYSTEM</span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase bg-[#1A1D23] px-2.5 py-1 rounded border border-[#333] text-gray-300 font-mono">
                    PERAN TERKAIT: {FLOW_STEPS[activeFlowStep].role}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </div>

                <h3 className="text-xl font-bold text-white mb-4">
                  {FLOW_STEPS[activeFlowStep].title}
                </h3>

                <p className="text-xs text-gray-300 leading-relaxed font-sans bg-[#07080A] p-5 rounded-xl border border-[#1A1D23] mb-6">
                  {FLOW_STEPS[activeFlowStep].desc}
                </p>

                {/* Contextual Visual simulation indicators inside */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-[#07080A]/60 rounded-lg border border-[#1A1D23]">
                    <div className="text-[8px] text-gray-500 font-mono">TRANSAKSI</div>
                    <div className="text-[11px] text-gray-300 font-semibold mt-0.5">Rupiah-Nominal</div>
                  </div>
                  <div className="p-3 bg-[#07080A]/60 rounded-lg border border-[#1A1D23]">
                    <div className="text-[8px] text-gray-500 font-mono">LEDGER STELLAR</div>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">Otomatis Sync</div>
                  </div>
                  <div className="p-3 bg-[#07080A]/60 rounded-lg border border-[#1A1D23] col-span-2 sm:col-span-1">
                    <div className="text-[8px] text-gray-500 font-mono">STATUS KONTRAK</div>
                    <div className="text-[11px] text-amber-400 font-semibold mt-0.5">State-Safe</div>
                  </div>
                </div>
              </div>

              {/* Navigation help inside the details box */}
              <div className="border-t border-[#1A1D23] pt-4 mt-8 flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>Klik tombol Sign In di bawah untuk mensimulasikan alur ini secara nyata.</span>
                <button
                  onClick={onSignIn}
                  className="text-emerald-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  Masuk Sekarang
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology deep-dive details & Docs ("Teknologi di Balik Layar") */}
      <section id="dokumentasi" className="relative z-10 border-t border-[#1A1D23] py-20 bg-[#07080A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase font-mono">TEKNIKAL &amp; DEPARTEMEN</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Dokumentasi Arsitektur Sistem</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Platform WSC bukan sekadar aplikasi pencatatan biasa. Kami menggabungkan 4 pilar teknologi canggih untuk menjamin integritas data, transparansi pendanaan, dan kepatuhan hukum.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Navigation Tabs List Left */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("stellar")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  activeTab === "stellar"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-white shadow-sm"
                    : "border-transparent bg-[#0F1115]/50 text-gray-400 hover:text-white hover:bg-[#0F1115]"
                }`}
              >
                <Link2 className="w-4.5 h-4.5 text-emerald-400" />
                <div className="text-xs font-bold uppercase tracking-wider font-mono">1. Rel Settlement Stellar</div>
              </button>

              <button
                onClick={() => setActiveTab("kms")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  activeTab === "kms"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-white shadow-sm"
                    : "border-transparent bg-[#0F1115]/50 text-gray-400 hover:text-white hover:bg-[#0F1115]"
                }`}
              >
                <Cpu className="w-4.5 h-4.5 text-emerald-400" />
                <div className="text-xs font-bold uppercase tracking-wider font-mono">2. KMS AES-256 Vault</div>
              </button>

              <button
                onClick={() => setActiveTab("doubleEntry")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  activeTab === "doubleEntry"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-white shadow-sm"
                    : "border-transparent bg-[#0F1115]/50 text-gray-400 hover:text-white hover:bg-[#0F1115]"
                }`}
              >
                <Layers className="w-4.5 h-4.5 text-emerald-400" />
                <div className="text-xs font-bold uppercase tracking-wider font-mono">3. Ledger Double-Entry</div>
              </button>

              <button
                onClick={() => setActiveTab("trustScore")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  activeTab === "trustScore"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-white shadow-sm"
                    : "border-transparent bg-[#0F1115]/50 text-gray-400 hover:text-white hover:bg-[#0F1115]"
                }`}
              >
                <Users className="w-4.5 h-4.5 text-emerald-400" />
                <div className="text-xs font-bold uppercase tracking-wider font-mono">4. Reputasi Trust Score</div>
              </button>
            </div>

            {/* Content Display Right */}
            <div className="lg:col-span-8 bg-[#0F1115] border border-[#262626] rounded-2xl p-6 sm:p-8">
              {activeTab === "stellar" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Stellar Blockchain Integration</h3>
                      <p className="text-[10px] text-gray-500 font-mono">TRANSPARANSI ALIRAN DANA MULTI-PARTY</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    Setiap persetujuan invoice oleh Koperasi secara otomatis memicu peristiwa <code className="bg-[#1A1D23] px-1.5 py-0.5 rounded font-mono text-emerald-400 text-[10px]">lock_funding()</code> di blockchain. 
                    Dana pendanaan dipasangkan dengan hash transaksi Stellar yang bersifat permanen, tidak dapat diubah (immutable), dan dapat diverifikasi oleh siapa saja di Stellar Explorer.
                  </p>

                  <div className="p-4 bg-[#07080A] rounded-xl border border-[#1A1D23] space-y-3 font-mono text-[10.5px]">
                    <div className="text-xs font-bold text-gray-400">⚡ Simulasi Transaksi Ledger Stellar:</div>
                    <div className="space-y-1 text-gray-300">
                      <p><span className="text-gray-500">Network:</span> TESTNET (Horizon Server Active)</p>
                      <p><span className="text-gray-500">Asset:</span> IDR_STABLECOIN (Simulated Fiat-Peg)</p>
                      <p><span className="text-gray-500">Contract Hash:</span> <span className="text-amber-400">C_WSC_ESCROW_6b91c28f3ea70de4</span></p>
                      <p><span className="text-gray-500">Escrow Balance:</span> <span className="text-emerald-400">Rp 2.450.000</span></p>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                    <li className="flex items-center gap-2 bg-[#07080A]/60 p-3 rounded-lg border border-[#1A1D23]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Settlement Real-time (~5 Detik)
                    </li>
                    <li className="flex items-center gap-2 bg-[#07080A]/60 p-3 rounded-lg border border-[#1A1D23]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Biaya Transaksi Sangat Rendah
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "kms" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">KMS Advanced Encryption Vault</h3>
                      <p className="text-[10px] text-gray-500 font-mono">KEAMANAN DATA PRIBADI MITRA (PII PROTECTION)</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    Kepatuhan terhadap regulasi privasi data adalah prioritas utama kami. Data sensitif pemilik warung (KTP, NIK, alamat lengkap) tidak disimpan dalam bentuk teks biasa. Data dienkripsi di sisi server (server-side envelope encryption) menggunakan algoritme <span className="font-semibold text-emerald-400">AES-256-GCM</span> yang kuncinya dikelola oleh sistem Key Management Service (KMS) terpusat.
                  </p>

                  <div className="p-4 bg-[#07080A] rounded-xl border border-[#1A1D23] space-y-3 font-mono text-[10.5px]">
                    <div className="text-xs font-bold text-gray-400">🔒 Skema Rotasi Kunci KMS:</div>
                    <p className="text-gray-300 leading-relaxed">
                      Kunci enkripsi utama dapat dirotasi kapan saja melalui panel admin tanpa merusak integritas enkripsi sebelumnya. Data NIK didekripsi secara aman dengan logging akses yang ketat demi mematuhi regulasi perlindungan data juri pilot.
                    </p>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                    <li className="flex items-center gap-2 bg-[#07080A]/60 p-3 rounded-lg border border-[#1A1D23]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Per-Column DB Encryption
                    </li>
                    <li className="flex items-center gap-2 bg-[#07080A]/60 p-3 rounded-lg border border-[#1A1D23]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      KMS Key-Rotation Terjadwal
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "doubleEntry" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Double-Entry Financial Ledger</h3>
                      <p className="text-[10px] text-gray-500 font-mono">AUDIT KEUANGAN YANG PRESISI &amp; TANGGUH</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    WSC Platform menerapkan standar akuntansi ketat dengan sistem Buku Besar Berpasangan (Double-Entry Ledger). Setiap perpindahan dana (pembayaran DP, pencairan ke supplier, cicilan cicilan) dicatat secara berpasangan pada akun Debit dan Kredit yang sesuai. Ini mencegah fraud, ketidaksesuaian saldo, dan mempermudah proses audit keuangan koperasi.
                  </p>

                  <div className="p-4 bg-[#07080A] rounded-xl border border-[#1A1D23] space-y-3 font-mono text-[10.5px]">
                    <div className="text-xs font-bold text-gray-400">📊 Chart of Accounts (COA) Sistem:</div>
                    <div className="grid grid-cols-2 gap-2 text-gray-400">
                      <p><span className="text-emerald-400">10100:</span> Kas Tersedia Platform (Aset)</p>
                      <p><span className="text-emerald-400">12100:</span> Piutang Outstanding (Aset)</p>
                      <p><span className="text-[#3b82f6]">20100:</span> Utang Investor Pool (Kewajiban)</p>
                      <p><span className="text-amber-400">40100:</span> Pendapatan Fee Admin (Ekuitas)</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "trustScore" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Dynamic Reputation Trust Score</h3>
                      <p className="text-[10px] text-gray-500 font-mono">ALGORITME PENILAIAN REPUTASI MANDIRI</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    Pemilik warung mengumpulkan reputasi &quot;Trust Score&quot; dinamis berdasarkan kepatuhan pembayaran angsuran mereka. Membayar cicilan tepat waktu meningkatkan poin reputasi secara bertahap, yang membuka akses ke limit kredit lebih besar dan suku bunga lebih rendah. Sebaliknya, keterlambatan pembayaran akan menurunkan skor secara otomatis.
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
                    <li className="flex items-center gap-2 bg-[#07080A]/60 p-3 rounded-lg border border-[#1A1D23]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Suku Bunga Murah via Reputasi Baik
                    </li>
                    <li className="flex items-center gap-2 bg-[#07080A]/60 p-3 rounded-lg border border-[#1A1D23]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Naik Limit Otomatis hingga Rp 25 Juta
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-[#1A1D23] py-20 bg-gradient-to-b from-[#0A0B0D] to-[#07080A] text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full w-fit mx-auto font-mono">
            UJI COBA PILOT SECURE-ROOT MVP
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Siap Mensimulasikan Keberlanjutan Finansial UMKM?
          </h2>
          
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Pilih salah satu dari 5 peran utama (Warung, Supplier, Koperasi, Investor, Admin) untuk mengalami bagaimana sistem pembiayaan stok retail berbasis Stellar disimulasikan secara utuh.
          </p>

          <div className="pt-4">
            <button
              onClick={onSignIn}
              className="bg-[#10B981] hover:bg-[#059669] text-black font-extrabold text-sm px-10 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] inline-flex items-center gap-2"
            >
              Masuk &amp; Mulai Sekarang
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

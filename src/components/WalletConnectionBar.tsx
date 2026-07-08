import { AlertTriangle, CheckCircle2, ExternalLink, Link2, Loader2, Wallet } from "lucide-react";

import { stellarConfig, getStellarExpertContractUrl, shortenStellarAddress } from "../config/stellar";
import { FreighterWalletState } from "../web3/freighter";

interface WalletConnectionBarProps {
  wallet: FreighterWalletState;
  loading: boolean;
  connected: boolean;
  networkMatches: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
}

export default function WalletConnectionBar({
  wallet,
  loading,
  connected,
  networkMatches,
  onConnect,
  onDisconnect,
  onRefresh,
}: WalletConnectionBarProps) {
  const contractUrl = stellarConfig.poolEscrowContractId
    ? getStellarExpertContractUrl(stellarConfig.poolEscrowContractId)
    : null;

  return (
    <div className="bg-[#0F1115] border-b border-[#1F2127] px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Wallet className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-mono">
              Freighter Testnet Wallet
            </div>
            <div className="text-xs font-bold text-gray-200 truncate">
              {connected ? shortenStellarAddress(wallet.address || "") : "Belum terhubung"}
              {connected && (
                <span className="ml-2 text-[10px] font-mono text-emerald-400">
                  {wallet.network || stellarConfig.network}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${
            connected ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-gray-700 bg-[#07080A] text-gray-400"
          }`}>
            {connected ? <CheckCircle2 className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
            {connected ? "wallet connected" : "demo ledger"}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${
            networkMatches ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-300"
          }`}>
            {networkMatches ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {networkMatches ? "testnet siap" : "cek network"}
          </span>
          <span className="rounded-full border border-[#1F2127] bg-[#07080A] px-2 py-1 text-gray-400">
            RPC: {stellarConfig.rpcUrl.replace("https://", "")}
          </span>
          {contractUrl && (
            <a
              href={contractUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-400 hover:text-white"
            >
              contract
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-[#262626] bg-[#07080A] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh"}
        </button>
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-300 hover:text-white"
          >
            Putuskan
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={loading || !wallet.installed}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            title={wallet.installed ? "Hubungkan Freighter" : "Install Freighter extension terlebih dahulu"}
          >
            Hubungkan
          </button>
        )}
      </div>
    </div>
  );
}

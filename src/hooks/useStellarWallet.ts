import { useCallback, useEffect, useMemo, useState } from "react";

import {
  connectFreighterWallet,
  FreighterWalletState,
  readFreighterWallet,
} from "../web3/freighter";
import { stellarConfig } from "../config/stellar";

const INITIAL_WALLET: FreighterWalletState = {
  installed: false,
  allowed: false,
  address: null,
  network: null,
  networkPassphrase: null,
  error: null,
};

export function useStellarWallet() {
  const [wallet, setWallet] = useState<FreighterWalletState>(INITIAL_WALLET);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setWallet(await readFreighterWallet());
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      setWallet(await connectFreighterWallet());
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet((prev) => ({
      ...prev,
      allowed: false,
      address: null,
      error: null,
    }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const networkMatches = useMemo(() => {
    if (!wallet.networkPassphrase) return false;
    return wallet.networkPassphrase === stellarConfig.networkPassphrase;
  }, [wallet.networkPassphrase]);

  return {
    wallet,
    loading,
    connected: Boolean(wallet.installed && wallet.allowed && wallet.address),
    networkMatches,
    connect,
    disconnect,
    refresh,
  };
}

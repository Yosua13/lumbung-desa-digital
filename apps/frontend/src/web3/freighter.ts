import {
  getAddress,
  getNetworkDetails,
  isAllowed,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";

import { stellarConfig } from "../config/stellar";

export interface FreighterWalletState {
  installed: boolean;
  allowed: boolean;
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  error: string | null;
}

export interface SignedTransactionResult {
  signedTxXdr: string;
  signerAddress: string | null;
}

type FreighterResult<T> = T & { error?: unknown };

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "Freighter request failed");
  }
  return "Freighter request failed";
}

export async function readFreighterWallet(): Promise<FreighterWalletState> {
  try {
    const connected = (await isConnected()) as FreighterResult<{ isConnected?: boolean }>;
    const installed = Boolean(connected.isConnected);

    if (!installed) {
      return {
        installed: false,
        allowed: false,
        address: null,
        network: null,
        networkPassphrase: null,
        error: getErrorMessage(connected.error),
      };
    }

    const allowedResult = (await isAllowed()) as FreighterResult<{ isAllowed?: boolean }>;
    const allowed = Boolean(allowedResult.isAllowed);
    const networkDetails = (await getNetworkDetails()) as FreighterResult<{
      network?: string;
      networkPassphrase?: string;
    }>;

    let address: string | null = null;
    if (allowed) {
      const addressResult = (await getAddress()) as FreighterResult<{ address?: string }>;
      address = addressResult.address || null;
    }

    return {
      installed,
      allowed,
      address,
      network: networkDetails.network || null,
      networkPassphrase: networkDetails.networkPassphrase || null,
      error: getErrorMessage(allowedResult.error || networkDetails.error),
    };
  } catch (error) {
    return {
      installed: false,
      allowed: false,
      address: null,
      network: null,
      networkPassphrase: null,
      error: getErrorMessage(error),
    };
  }
}

export async function connectFreighterWallet(): Promise<FreighterWalletState> {
  const connected = await readFreighterWallet();
  if (!connected.installed) return connected;

  const access = (await requestAccess()) as FreighterResult<{ address?: string }>;
  if (!access.address) {
    return {
      ...connected,
      allowed: false,
      address: null,
      error: getErrorMessage(access.error) || "Freighter tidak memberikan akses akun.",
    };
  }

  const refreshed = await readFreighterWallet();
  return {
    ...refreshed,
    allowed: true,
    address: access.address,
    error: refreshed.error,
  };
}

export async function signWithFreighter(txXdr: string): Promise<SignedTransactionResult> {
  const result = (await signTransaction(txXdr, {
    networkPassphrase: stellarConfig.networkPassphrase,
    address: undefined,
  })) as FreighterResult<{ signedTxXdr?: string; signerAddress?: string }>;

  if (!result.signedTxXdr) {
    throw new Error(getErrorMessage(result.error) || "Freighter gagal menandatangani transaksi.");
  }

  return {
    signedTxXdr: result.signedTxXdr,
    signerAddress: result.signerAddress || null,
  };
}

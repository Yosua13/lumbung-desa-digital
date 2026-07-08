export type StellarNetworkKey = "testnet" | "mainnet" | "futurenet";

export interface StellarAppConfig {
  appUrl: string;
  enableLiveStellar: boolean;
  network: StellarNetworkKey;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
  poolEscrowContractId: string;
  idrAssetCode: string;
  idrAssetIssuer: string;
}

const NETWORK_PASSPHRASES: Record<StellarNetworkKey, string> = {
  testnet: "Test SDF Network ; September 2015",
  mainnet: "Public Global Stellar Network ; September 2015",
  futurenet: "Test SDF Future Network ; October 2022",
};

function asNetworkKey(value?: string): StellarNetworkKey {
  const normalized = (value || "testnet").toLowerCase();
  if (normalized === "mainnet" || normalized === "public") return "mainnet";
  if (normalized === "futurenet") return "futurenet";
  return "testnet";
}

function env(name: string, fallback = ""): string {
  return (import.meta.env[name] as string | undefined) || fallback;
}

const network = asNetworkKey(env("VITE_STELLAR_NETWORK", "testnet"));

export const stellarConfig: StellarAppConfig = {
  appUrl: env("VITE_APP_URL", "http://localhost:3000"),
  enableLiveStellar: env("VITE_ENABLE_LIVE_STELLAR", "false") === "true",
  network,
  networkPassphrase: NETWORK_PASSPHRASES[network],
  rpcUrl: env("VITE_STELLAR_RPC_URL", "https://soroban-testnet.stellar.org"),
  horizonUrl: env("VITE_STELLAR_HORIZON_URL", "https://horizon-testnet.stellar.org"),
  poolEscrowContractId: env("VITE_WSC_POOL_ESCROW_CONTRACT_ID"),
  idrAssetCode: env("VITE_WSC_IDR_ASSET_CODE", "IDR"),
  idrAssetIssuer: env("VITE_WSC_IDR_ASSET_ISSUER"),
};

export function getStellarExpertTxUrl(txHash: string): string {
  const explorerNetwork = stellarConfig.network === "mainnet" ? "public" : stellarConfig.network;
  return `https://stellar.expert/explorer/${explorerNetwork}/tx/${txHash}`;
}

export function getStellarExpertContractUrl(contractId: string): string {
  const explorerNetwork = stellarConfig.network === "mainnet" ? "public" : stellarConfig.network;
  return `https://stellar.expert/explorer/${explorerNetwork}/contract/${contractId}`;
}

export function shortenStellarAddress(address: string, visible = 5): string {
  if (!address) return "";
  if (address.length <= visible * 2 + 3) return address;
  return `${address.slice(0, visible)}...${address.slice(-visible)}`;
}

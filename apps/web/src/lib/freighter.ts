import { isConnected, requestAccess, getNetwork, signTransaction } from "@stellar/freighter-api";

export const connectFreighter = async () => {
  const connection = await isConnected();
  if (!connection || !connection.isConnected) {
    throw new Error("Freighter wallet not detected. Please install the Freighter extension.");
  }
  
  const access = await requestAccess();
  if (access.error) {
    throw new Error("Access denied: " + access.error);
  }
  
  const net = await getNetwork();
  if (net.error) {
    console.warn("Failed to retrieve network details:", net.error);
  }
  
  return { 
    publicKey: access.address, 
    network: net.network || 'TESTNET' 
  };
};

export const signTx = async (xdr: string) => {
  const result = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
  
  if (result.error) {
    throw new Error("Transaction signing rejected or failed: " + result.error);
  }
  
  return result.signedTxXdr;
};

export const assertTestnet = async () => {
  const net = await getNetwork();
  if (net.network !== "TESTNET") {
    throw new Error("Please configure your Freighter wallet network to TESTNET.");
  }
};

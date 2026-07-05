import { connectFreighter, signTx } from '../lib/freighter';

export const walletService = {
  connect: async () => {
    return connectFreighter();
  },
  getPublicKey: async () => {
    const res = await connectFreighter();
    return res.publicKey;
  },
  signTransaction: async (xdr: string) => {
    return signTx(xdr);
  },
  disconnect: async () => {
    // Freighter doesn't support programmatic disconnection; we clear state on client
    return true;
  }
};

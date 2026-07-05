import { mockCreditRequests, mockWarungs, mockProducts } from '../mocks';

const API_URL = 'http://localhost:8080/api';

export const supplierService = {
  getDashboard: async (walletAddress: string) => {
    try {
      const res = await fetch(`${API_URL}/supplier/dashboard`, {
        headers: { 'X-Wallet-Address': walletAddress }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock supplier dashboard");
    }
    return {
      company_name: "Aneka Makmur Jaya",
      city: "Bandung",
      pending_requests: mockCreditRequests.length,
      active_invoices: 4,
      payouts_pending: 32750000,
      total_sales: 458230000
    };
  },

  getRequests: async (walletAddress: string) => {
    try {
      const res = await fetch(`${API_URL}/supplier/requests`, {
        headers: { 'X-Wallet-Address': walletAddress }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock requests");
    }
    return mockCreditRequests;
  },

  approveRequest: async (walletAddress: string, requestId: number) => {
    const res = await fetch(`${API_URL}/supplier/requests/${requestId}/approve`, {
      method: 'POST',
      headers: { 'X-Wallet-Address': walletAddress }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to approve request");
    }
    return await res.json();
  },

  rejectRequest: async (walletAddress: string, requestId: number) => {
    const res = await fetch(`${API_URL}/supplier/requests/${requestId}/reject`, {
      method: 'POST',
      headers: { 'X-Wallet-Address': walletAddress }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to reject request");
    }
    return await res.json();
  },

  prepareMarkShipped: async (walletAddress: string, invoiceId: number) => {
    const res = await fetch(`${API_URL}/supplier/invoices/${invoiceId}/mark-shipped`, {
      method: 'POST',
      headers: { 'X-Wallet-Address': walletAddress }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json(); // returns unsigned XDR
  },

  submitMarkShipped: async (walletAddress: string, invoiceId: number, signedXdr: string) => {
    const res = await fetch(`${API_URL}/supplier/invoices/${invoiceId}/mark-shipped`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': walletAddress
      },
      body: JSON.stringify({ signed_xdr: signedXdr })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json();
  },

  getWarungs: async () => {
    return mockWarungs;
  },

  getProducts: async () => {
    return mockProducts;
  },

  addProduct: async (_walletAddress: string, product: any) => {
    // Simulated add product
    return { success: true, product };
  },

  updateProduct: async (_walletAddress: string, _id: number, product: any) => {
    return { success: true, product };
  },

  setProductStatus: async (_walletAddress: string, _id: number, is_active: boolean) => {
    return { success: true, id: _id, is_active };
  }
};

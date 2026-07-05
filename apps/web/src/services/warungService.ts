import { mockProducts, mockInvoices, mockRepayments } from '../mocks';

const API_URL = 'http://localhost:8080/api';

export const warungService = {
  getDashboard: async (walletAddress: string) => {
    try {
      const res = await fetch(`${API_URL}/warung/dashboard`, {
        headers: { 'X-Wallet-Address': walletAddress }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock dashboard data");
    }
    return {
      warung_name: "Warung Sari Jaya",
      owner_name: "Bu Sari",
      city: "Bandung",
      credit_limit: 25000000,
      available_limit: 12350000,
      reputation_score: 835,
      active_invoice_sum: 8650000,
      next_repayment_amount: 2450000,
      next_repayment_due: "24 Mei 2025"
    };
  },

  getProducts: async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock products");
    }
    return mockProducts;
  },

  createCreditRequest: async (walletAddress: string, supplierId: number, items: { product_id: number; quantity: number }[]) => {
    const res = await fetch(`${API_URL}/credit-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': walletAddress
      },
      body: JSON.stringify({ supplier_id: supplierId, items })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to submit request");
    }
    return await res.json();
  },

  getInvoices: async (walletAddress: string) => {
    try {
      const res = await fetch(`${API_URL}/invoices`, {
        headers: { 'X-Wallet-Address': walletAddress }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock invoices");
    }
    return mockInvoices;
  },

  getInvoiceDetail: async (invoiceId: number) => {
    try {
      const res = await fetch(`${API_URL}/invoices/${invoiceId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock invoice detail");
    }
    const inv = mockInvoices.find(i => i.id === invoiceId) || mockInvoices[0];
    return {
      invoice: inv,
      items: [
        { name: 'Beras Premium 5kg', quantity: 16, price: 180000, subtotal: 2880000 },
        { name: 'Diskon', quantity: 1, price: -300000, subtotal: -300000 }
      ],
      repayments: mockRepayments
    };
  },

  prepareConfirmDelivery: async (walletAddress: string, invoiceId: number) => {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/confirm-delivery`, {
      method: 'POST',
      headers: { 'X-Wallet-Address': walletAddress }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json(); // returns unsigned XDR
  },

  submitConfirmDelivery: async (walletAddress: string, invoiceId: number, signedXdr: string) => {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/confirm-delivery`, {
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

  preparePayInstallment: async (walletAddress: string, invoiceId: number, amount: number) => {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/pay-installment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': walletAddress
      },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json(); // returns unsigned XDR
  },

  submitPayInstallment: async (walletAddress: string, invoiceId: number, amount: number, signedXdr: string) => {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/pay-installment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': walletAddress
      },
      body: JSON.stringify({ amount, signed_xdr: signedXdr })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json();
  }
};

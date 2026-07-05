import { mockCommunities, mockInvoices } from '../mocks';

const API_URL = 'http://localhost:8080/api';

export const adminService = {
  getDashboard: async () => {
    try {
      const res = await fetch(`${API_URL}/admin/invoices`);
      // Simulating dashboard aggregation
      if (res.ok) {
        const invoices = await res.json();
        const totalDisbursed = invoices.reduce((sum: number, i: any) => sum + i.total_amount, 0);
        const activePort = invoices.filter((i: any) => i.status !== 'Paid' && i.status !== 'Cancelled').reduce((sum: number, i: any) => sum + i.outstanding_amount, 0);
        return {
          communities_active: mockCommunities.length,
          warungs_funded: invoices.length,
          funds_disbursed: totalDisbursed,
          portfolio_active: activePort,
          repayment_rate: 96
        };
      }
    } catch (e) {
      console.warn("REST API offline, falling back to mock admin dashboard");
    }
    return {
      communities_active: mockCommunities.length,
      warungs_funded: 124,
      funds_disbursed: 450000000,
      portfolio_active: 86500000,
      repayment_rate: 96
    };
  },

  getInvoices: async () => {
    try {
      const res = await fetch(`${API_URL}/admin/invoices`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock admin invoices");
    }
    // Transform mockInvoices to match the admin invoices model (include supplier/warung name)
    return mockInvoices.map(inv => ({
      id: inv.id,
      contract_invoice_id: inv.contract_invoice_id,
      warung_name: inv.warung_name,
      company_name: inv.supplier_name,
      total_amount: inv.total_amount,
      outstanding_amount: inv.outstanding_amount,
      status: inv.status,
      due_date: inv.due_date
    }));
  },

  prepareFundInvoice: async (walletAddress: string, invoiceId: number) => {
    const res = await fetch(`${API_URL}/admin/invoices/${invoiceId}/fund`, {
      method: 'POST',
      headers: { 'X-Wallet-Address': walletAddress }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json(); // returns unsigned XDR
  },

  submitFundInvoice: async (walletAddress: string, invoiceId: number, signedXdr: string) => {
    const res = await fetch(`${API_URL}/admin/invoices/${invoiceId}/fund`, {
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

  prepareResolveDispute: async (walletAddress: string, invoiceId: number, releaseToSupplier: boolean) => {
    const res = await fetch(`${API_URL}/admin/disputes/${invoiceId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': walletAddress
      },
      body: JSON.stringify({ release_to_supplier: releaseToSupplier })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json(); // returns unsigned XDR
  },

  submitResolveDispute: async (walletAddress: string, invoiceId: number, releaseToSupplier: boolean, signedXdr: string) => {
    const res = await fetch(`${API_URL}/admin/disputes/${invoiceId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': walletAddress
      },
      body: JSON.stringify({ release_to_supplier: releaseToSupplier, signed_xdr: signedXdr })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json();
  },

  getEvents: async () => {
    try {
      const res = await fetch(`${API_URL}/admin/contract-events`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, falling back to mock events");
    }
    return [
      { id: 1, invoice_id: 1, event_name: 'installment_paid', tx_hash: 'tx_event_hash_1', ledger: 10245, payload_json: '{"amount": 612500}', created_at: new Date().toISOString() },
      { id: 2, invoice_id: 1, event_name: 'delivery_confirmed', tx_hash: 'tx_event_hash_2', ledger: 10238, payload_json: '{"warung": "GBWARUNG..."}', created_at: new Date(Date.now() - 3600000).toISOString() }
    ];
  },

  getCommunities: async () => {
    return mockCommunities;
  },

  getUsers: async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("REST API offline, cannot fetch users");
    }
    return [];
  },

  updateUserRole: async (userId: number, role: string) => {
    const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return await res.json();
  }
};

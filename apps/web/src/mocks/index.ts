import type { Product, Invoice, CreditRequest, Repayment } from '../../../../packages/shared-types';

// 1. Catalog Products (Seeded exactly to match mockup screenshots)
export const mockProducts: Product[] = [
  {
    id: 1,
    supplier_id: 1,
    name: 'Beras Premium 5kg',
    category: 'Sembako',
    unit: 'karung',
    price: 75000,
    min_order: 2,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400',
    is_active: true
  },
  {
    id: 2,
    supplier_id: 1,
    name: 'Minyak Goreng SunCo 2L',
    category: 'Minyak',
    unit: 'pouch',
    price: 34000,
    min_order: 6,
    stock: 150,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400',
    is_active: true
  },
  {
    id: 3,
    supplier_id: 1,
    name: 'Indomie Mi Goreng',
    category: 'Mie Instan',
    unit: 'dus (40 pcs)',
    price: 115000,
    min_order: 1,
    stock: 80,
    image_url: 'https://images.unsplash.com/photo-1612966608967-3cec33142e4f?q=80&w=400',
    is_active: true
  },
  {
    id: 4,
    supplier_id: 1,
    name: 'Gula Pasir 1kg',
    category: 'Gula',
    unit: 'pcs',
    price: 16000,
    min_order: 10,
    stock: 90,
    image_url: 'https://images.unsplash.com/photo-1596450541743-74a6888513b3?q=80&w=400',
    is_active: true
  },
  {
    id: 5,
    supplier_id: 1,
    name: 'Telur Ayam Negeri (1kg)',
    category: 'Telur',
    unit: 'kg',
    price: 24000,
    min_order: 2,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?q=80&w=400',
    is_active: true
  },
  {
    id: 6,
    supplier_id: 1,
    name: 'Susu Kental Manis Frisian Flag 370g',
    category: 'Minuman',
    unit: 'kaleng',
    price: 11500,
    min_order: 6,
    stock: 200,
    image_url: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?q=80&w=400',
    is_active: true
  },
  {
    id: 7,
    supplier_id: 1,
    name: 'Tepung Terigu Segitiga Biru 1kg',
    category: 'Sembako',
    unit: 'pcs',
    price: 13500,
    min_order: 10,
    stock: 120,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400',
    is_active: true
  },
  {
    id: 8,
    supplier_id: 1,
    name: 'Kecap Manis Bango 600ml',
    category: 'Sembako',
    unit: 'pouch',
    price: 22000,
    min_order: 6,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=400',
    is_active: true
  },
  {
    id: 9,
    supplier_id: 1,
    name: 'Air Mineral Aqua 600ml',
    category: 'Minuman',
    unit: 'dus (24 botol)',
    price: 48000,
    min_order: 1,
    stock: 150,
    image_url: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f1c?q=80&w=400',
    is_active: true
  }
];

// 2. Mock Invoices (matching invoice screenshots)
export const mockInvoices: Invoice[] = [
  {
    id: 1,
    contract_invoice_id: 1,
    credit_request_id: 1,
    warung_id: 1,
    supplier_id: 1,
    funder_wallet: 'GBFUNDERSEED0000000000000000000000000000000000000001',
    asset_contract: 'CDLZFC3SYJ272UXSTZ42H56U2XJ5WCDLX7G2RNDVGWDTY2T2T2T2T2T2',
    total_amount: 3000000,
    outstanding_amount: 2450000,
    installment_count: 6,
    paid_installments: 2,
    status: 'Repaying',
    due_date: '2026-07-24T00:00:00Z',
    tx_hash_create: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    tx_hash_fund: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
    tx_hash_release: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
    warung_name: 'Warung Grosir Nusantara',
    supplier_name: 'SRC Makmur Jaya',
    warung_wallet: 'GBWARUNGSEED000000000000000000000000000000000000001',
    supplier_wallet: 'GBSUPPLIERSEED0000000000000000000000000000000000001'
  },
  {
    id: 2,
    contract_invoice_id: 2,
    credit_request_id: 2,
    warung_id: 1,
    supplier_id: 2,
    funder_wallet: 'GBFUNDERSEED0000000000000000000000000000000000000001',
    asset_contract: 'CDLZFC3SYJ272UXSTZ42H56U2XJ5WCDLX7G2RNDVGWDTY2T2T2T2T2T2',
    total_amount: 4000000,
    outstanding_amount: 3200000,
    installment_count: 8,
    paid_installments: 2,
    status: 'Repaying',
    due_date: '2026-06-02T00:00:00Z',
    tx_hash_create: 'TX_CREATE_028',
    tx_hash_fund: 'TX_FUND_028',
    tx_hash_release: 'TX_RELEASE_028',
    warung_name: 'Warung Grosir Nusantara',
    supplier_name: 'Agen Sembako Jaya',
    warung_wallet: 'GBWARUNGSEED000000000000000000000000000000000000001',
    supplier_wallet: 'GBSUPPLIERSEED0000000000000000000000000000000000002'
  },
  {
    id: 3,
    contract_invoice_id: 3,
    credit_request_id: 3,
    warung_id: 1,
    supplier_id: 3,
    funder_wallet: 'GBFUNDERSEED0000000000000000000000000000000000000001',
    asset_contract: 'CDLZFC3SYJ272UXSTZ42H56U2XJ5WCDLX7G2RNDVGWDTY2T2T2T2T2T2',
    total_amount: 3800000,
    outstanding_amount: 3000000,
    installment_count: 8,
    paid_installments: 3,
    status: 'Repaying',
    due_date: '2026-06-10T00:00:00Z',
    tx_hash_create: 'TX_CREATE_015',
    tx_hash_fund: 'TX_FUND_015',
    tx_hash_release: 'TX_RELEASE_015',
    warung_name: 'Warung Grosir Nusantara',
    supplier_name: 'Warung Grosir Nusantara',
    warung_wallet: 'GBWARUNGSEED000000000000000000000000000000000000001',
    supplier_wallet: 'GBSUPPLIERSEED0000000000000000000000000000000000003'
  }
];

// 3. Mock Repayments (cicilan)
export const mockRepayments: Repayment[] = [
  { id: 1, invoice_id: 1, installment_no: 1, amount: 2450000 / 4, due_date: '2026-04-24T00:00:00Z', paid_at: '2026-04-24T10:12:00Z', status: 'PAID', tx_hash: 'tx_repay_1' },
  { id: 2, invoice_id: 1, installment_no: 2, amount: 2450000 / 4, due_date: '2026-05-24T00:00:00Z', paid_at: null, status: 'UNPAID', tx_hash: null },
  { id: 3, invoice_id: 1, installment_no: 3, amount: 2450000 / 4, due_date: '2026-06-24T00:00:00Z', paid_at: null, status: 'UNPAID', tx_hash: null },
  { id: 4, invoice_id: 1, installment_no: 4, amount: 2450000 / 4, due_date: '2026-07-24T00:00:00Z', paid_at: null, status: 'UNPAID', tx_hash: null }
];

// 4. Mock Credit Requests (Permintaan stok supplier)
export const mockCreditRequests: CreditRequest[] = [
  {
    id: 1,
    warung_id: 1,
    supplier_id: 1,
    total_amount: 746000,
    status: 'REQUESTED',
    requested_at: '2026-07-05T12:00:00Z',
    approved_at: null,
    warung_name: 'Warung Sari Jaya',
    reputation_score: 835
  },
  {
    id: 2,
    warung_id: 2,
    supplier_id: 1,
    total_amount: 4500000,
    status: 'REQUESTED',
    requested_at: '2026-07-04T10:00:00Z',
    approved_at: null,
    warung_name: 'Toko Sejahtera',
    reputation_score: 680
  },
  {
    id: 3,
    warung_id: 3,
    supplier_id: 1,
    total_amount: 3750000,
    status: 'REQUESTED',
    requested_at: '2026-07-04T15:30:00Z',
    approved_at: null,
    warung_name: 'Maju Rezeki',
    reputation_score: 650
  }
];

// 5. Mock Communities
export interface Community {
  id: number;
  name: string;
  total_members: number;
  total_funding: number;
  repayment_rate: number;
  risk_level: 'Rendah' | 'Sedang' | 'Tinggi';
}

export const mockCommunities: Community[] = [
  { id: 1, name: 'Paguyuban Warung Bandung Wetan', total_members: 24, total_funding: 150000000, repayment_rate: 98, risk_level: 'Rendah' },
  { id: 2, name: 'Koperasi Pasar Caringin', total_members: 42, total_funding: 320000000, repayment_rate: 94, risk_level: 'Rendah' },
  { id: 3, name: 'UMKM Mandiri Cimahi', total_members: 15, total_funding: 85000000, repayment_rate: 88, risk_level: 'Sedang' }
];

// 6. Mock Warungs for Admin/Supplier List
export interface WarungStats {
  id: number;
  name: string;
  owner: string;
  city: string;
  last_order: string;
  total_invoices: number;
  credit_limit: number;
  available_limit: number;
  reputation_score: number;
  risk_score: number;
  status: 'active' | 'inactive';
}

export const mockWarungs: WarungStats[] = [
  { id: 1, name: 'Warung Sari Jaya', owner: 'Bu Sari', city: 'Bandung', last_order: '2026-07-05', total_invoices: 12, credit_limit: 25000000, available_limit: 12350000, reputation_score: 835, risk_score: 15, status: 'active' },
  { id: 2, name: 'Toko Sejahtera', owner: 'Pak Budi', city: 'Bekasi', last_order: '2026-07-04', total_invoices: 6, credit_limit: 15000000, available_limit: 10500000, reputation_score: 680, risk_score: 45, status: 'active' },
  { id: 3, name: 'Maju Rezeki', owner: 'Bu Herlina', city: 'Depok', last_order: '2026-07-04', total_invoices: 9, credit_limit: 20000000, available_limit: 16250000, reputation_score: 650, risk_score: 55, status: 'active' },
  { id: 4, name: 'Berkah Sembako', owner: 'Pak Ujang', city: 'Bogor', last_order: '2026-07-03', total_invoices: 4, credit_limit: 10000000, available_limit: 7200000, reputation_score: 610, risk_score: 65, status: 'active' },
  { id: 5, name: 'Toko Sejahtera 2', owner: 'Pak Anton', city: 'Tangerang', last_order: '2026-07-02', total_invoices: 15, credit_limit: 30000000, available_limit: 26750000, reputation_score: 700, risk_score: 30, status: 'active' }
];

// 7. Mock Supplier profile metadata
export interface SupplierStats {
  id: number;
  name: string;
  company_name: string;
  volume: number;
  partners: number;
  payout_rate: number;
  status: 'Verified' | 'Pending';
}

export const mockSuppliers: SupplierStats[] = [
  { id: 1, name: 'SRC Makmur Jaya', company_name: 'PT Makmur Sentosa', volume: 458230000, partners: 18, payout_rate: 99, status: 'Verified' },
  { id: 2, name: 'Sumber Baru Sembako', company_name: 'CV Sumber Baru', volume: 284500000, partners: 12, payout_rate: 97, status: 'Verified' },
  { id: 3, name: 'Maju Rezeki Supplier', company_name: 'PT Maju Rezeki Indonesia', volume: 152000000, partners: 6, payout_rate: 95, status: 'Verified' }
];

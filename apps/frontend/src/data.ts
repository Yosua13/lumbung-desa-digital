/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoleCode, Party, WarungProfile, SupplierProfile, Product, Invoice, InvoiceItem, CooperativePool, PoolContribution, LedgerAccount, StellarTransaction, AuditLog, RepaymentSchedule } from "./types";
import { generateId, generateStellarTxHash, encryptData } from "./utils";

// 1. Core Parties (Warungs, Suppliers, Koperasi, Investors, Admin)
export const initialParties: Party[] = [
  // Koperasi & Admin
  {
    id: "party-coop-01",
    party_type: RoleCode.KOPERASI,
    legal_name: "Koperasi Unit Desa (KUD) Mandiri Bersama",
    display_name: "Koperasi Mandiri Bersama",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "party-admin-01",
    party_type: RoleCode.ADMIN,
    legal_name: "Stellar Settlement Platform Administrator",
    display_name: "Platform Admin",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
  },
  // Suppliers (3)
  {
    id: "party-supplier-01",
    party_type: RoleCode.SUPPLIER,
    legal_name: "PT Sembako Makmur Jaya",
    display_name: "Sembako Makmur Jaya",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "party-supplier-02",
    party_type: RoleCode.SUPPLIER,
    legal_name: "CV Tirta Segar Nusantara",
    display_name: "Tirta Segar Distribusi",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "party-supplier-03",
    party_type: RoleCode.SUPPLIER,
    legal_name: "PT Griya Bersih Abadi",
    display_name: "Griya Bersih Abadi",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=150&q=80"
  },
  // Investors (3)
  {
    id: "party-investor-01",
    party_type: RoleCode.INVESTOR,
    legal_name: "Yosua Rey (reyyosua29@gmail.com)",
    display_name: "Rey Yosua (Lead Investor)",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "party-investor-02",
    party_type: RoleCode.INVESTOR,
    legal_name: "Budi Santoso",
    display_name: "Budi Santoso",
    kyc_status: "APPROVED",
    risk_level: "MEDIUM",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "party-investor-03",
    party_type: RoleCode.INVESTOR,
    legal_name: "Siti Rahma",
    display_name: "Siti Rahma",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&q=80"
  },
  // Warungs (10 Pilot Warungs as specified in NFR/Metrics)
  {
    id: "party-warung-01",
    party_type: RoleCode.WARUNG,
    legal_name: "Warung Ibu Asih",
    display_name: "Warung Bu Asih",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1536411396596-afced9ed251b?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273012908750002"
  },
  {
    id: "party-warung-02",
    party_type: RoleCode.WARUNG,
    legal_name: "Toko Kelontong Berkah",
    display_name: "Toko Berkah",
    kyc_status: "APPROVED",
    risk_level: "MEDIUM",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273010411800001"
  },
  {
    id: "party-warung-03",
    party_type: RoleCode.WARUNG,
    legal_name: "Warung Madura Barokah",
    display_name: "Warung Madura",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273021503880005"
  },
  {
    id: "party-warung-04",
    party_type: RoleCode.WARUNG,
    legal_name: "Kedai Kopi Pak Joko",
    display_name: "Kedai Pak Joko",
    kyc_status: "APPROVED",
    risk_level: "MEDIUM",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273051212780001"
  },
  {
    id: "party-warung-05",
    party_type: RoleCode.WARUNG,
    legal_name: "Warung Sembako Lestari",
    display_name: "Sembako Lestari",
    kyc_status: "PENDING",
    risk_level: "HIGH",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273062304910003"
  },
  {
    id: "party-warung-06",
    party_type: RoleCode.WARUNG,
    legal_name: "Toko Sinar Rejeki",
    display_name: "Toko Sinar Rejeki",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273081408840002"
  },
  {
    id: "party-warung-07",
    party_type: RoleCode.WARUNG,
    legal_name: "Warung Sunda Neng Gita",
    display_name: "Warung Neng Gita",
    kyc_status: "NEED_REVISION",
    risk_level: "HIGH",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273090709940004"
  },
  {
    id: "party-warung-08",
    party_type: RoleCode.WARUNG,
    legal_name: "Kedai Baraya",
    display_name: "Kedai Baraya",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273100201830001"
  },
  {
    id: "party-warung-09",
    party_type: RoleCode.WARUNG,
    legal_name: "Kios Pojok Serbaguna",
    display_name: "Kios Pojok",
    kyc_status: "APPROVED",
    risk_level: "MEDIUM",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273111811890003"
  },
  {
    id: "party-warung-10",
    party_type: RoleCode.WARUNG,
    legal_name: "Warung Sejahtera Bersama",
    display_name: "Warung Sejahtera",
    kyc_status: "APPROVED",
    risk_level: "LOW",
    status: "ACTIVE",
    avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=150&q=80",
    ktp_number_encrypted: "3273121510860002"
  }
];

// 2. Warung Profiles (linked to above parties)
export const initialWarungProfiles: WarungProfile[] = [
  {
    party_id: "party-warung-01",
    owner_name: "Asih Setyawati",
    address: "Jl. Cihampelas No. 124, Coblong",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 15000000,
    trust_score: 95.5,
    limit_amount: 10000000,
    available_limit: 10000000
  },
  {
    party_id: "party-warung-02",
    owner_name: "Ahmad Subarjo",
    address: "Jl. Dipati Ukur No. 45, Coblong",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 12000000,
    trust_score: 82.0,
    limit_amount: 8000000,
    available_limit: 5000000 // Rp 3M used in initial invoice simulation
  },
  {
    party_id: "party-warung-03",
    owner_name: "Mahmud Al-Madura",
    address: "Jl. Pasir Kaliki No. 182, Cicendo",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 25000000,
    trust_score: 98.0,
    limit_amount: 15000000,
    available_limit: 15000000
  },
  {
    party_id: "party-warung-04",
    owner_name: "Joko Pranoto",
    address: "Jl. Pasteur No. 12, Sukajadi",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 9500000,
    trust_score: 75.0,
    limit_amount: 5000000,
    available_limit: 5000000
  },
  {
    party_id: "party-warung-05",
    owner_name: "Lestari Rahayu",
    address: "Jl. Braga No. 89, Sumur Bandung",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 18000000,
    trust_score: 50.0,
    limit_amount: 0, // Pending Verification
    available_limit: 0
  },
  {
    party_id: "party-warung-06",
    owner_name: "Rian Hendrawan",
    address: "Jl. Buah Batu No. 201, Lengkong",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 14000000,
    trust_score: 88.5,
    limit_amount: 7500000,
    available_limit: 7500000
  },
  {
    party_id: "party-warung-07",
    owner_name: "Gita Purnamasari",
    address: "Jl. Kopo No. 340, Bojongloa Kaler",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 11000000,
    trust_score: 45.0,
    limit_amount: 0, // Need Revision
    available_limit: 0
  },
  {
    party_id: "party-warung-08",
    owner_name: "Cecep Baraya",
    address: "Jl. Soekarno-Hatta No. 456, Batununggal",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 16500000,
    trust_score: 91.0,
    limit_amount: 10000000,
    available_limit: 10000000
  },
  {
    party_id: "party-warung-09",
    owner_name: "Indra Wijaya",
    address: "Jl. Antapani No. 78, Antapani",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 8000000,
    trust_score: 79.5,
    limit_amount: 5000000,
    available_limit: 5000000
  },
  {
    party_id: "party-warung-10",
    owner_name: "Dewi Sejahtera",
    address: "Jl. Dago Elok No. 5, Coblong",
    city: "Bandung",
    province: "Jawa Barat",
    monthly_turnover_estimate: 21000000,
    trust_score: 93.0,
    limit_amount: 12000000,
    available_limit: 12000000
  }
];

// 3. Supplier Profiles
export const initialSupplierProfiles: SupplierProfile[] = [
  {
    party_id: "party-supplier-01",
    business_name: "PT Sembako Makmur Jaya",
    service_area: "Kota Bandung & Kabupaten Bandung",
    settlement_bank_code: "BCA",
    settlement_account_no_encrypted: "0245******3928", // visualized secure mask
    auto_cashout_enabled: true,
    supplier_fee_rate: 0.01 // legacy reference only; payout uses fixed cost tiers
  },
  {
    party_id: "party-supplier-02",
    business_name: "CV Tirta Segar Nusantara",
    service_area: "Seluruh Wilayah Bandung Raya",
    settlement_bank_code: "Mandiri",
    settlement_account_no_encrypted: "13100******4928",
    auto_cashout_enabled: true,
    supplier_fee_rate: 0.012 // legacy reference only; payout uses fixed cost tiers
  },
  {
    party_id: "party-supplier-03",
    business_name: "PT Griya Bersih Abadi",
    service_area: "Kota Bandung, Cimahi & Jatinangor",
    settlement_bank_code: "BNI",
    settlement_account_no_encrypted: "0492******1982",
    auto_cashout_enabled: true,
    supplier_fee_rate: 0.015 // legacy reference only; payout uses fixed cost tiers
  }
];

// 4. Products (pre-loaded catalog as per fast-moving goods specification)
export const initialProducts: Product[] = [
  // PT Sembako Makmur Jaya (Sembako)
  {
    id: "prod-01",
    supplier_id: "party-supplier-01",
    category: "Sembako",
    name: "Beras Pandan Wangi Premium 10kg",
    unit: "karung",
    unit_price: 155000,
    minimum_order_qty: 2,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-02",
    supplier_id: "party-supplier-01",
    category: "Sembako",
    name: "Minyak Goreng Bimoli 2L",
    unit: "pouch",
    unit_price: 36500,
    minimum_order_qty: 6,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-03",
    supplier_id: "party-supplier-01",
    category: "Sembako",
    name: "Gula Pasir Gulaku Premium 1kg",
    unit: "pcs",
    unit_price: 17500,
    minimum_order_qty: 10,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1595123552225-0c4d397075c3?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-04",
    supplier_id: "party-supplier-01",
    category: "Sembako",
    name: "Tepung Terigu Segitiga Biru 1kg",
    unit: "pcs",
    unit_price: 14000,
    minimum_order_qty: 10,
    stock_status: "LIMITED",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=150&q=80"
  },
  // CV Tirta Segar Nusantara (Minuman)
  {
    id: "prod-05",
    supplier_id: "party-supplier-02",
    category: "Minuman",
    name: "Teh Botol Sosro Sosro 250ml",
    unit: "karton (24 pcs)",
    unit_price: 68000,
    minimum_order_qty: 3,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-06",
    supplier_id: "party-supplier-02",
    category: "Minuman",
    name: "Aqua Air Mineral Gelas 220ml",
    unit: "karton (48 cup)",
    unit_price: 34000,
    minimum_order_qty: 5,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1608885898957-a599fb18ec3f?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-07",
    supplier_id: "party-supplier-02",
    category: "Minuman",
    name: "Kopi Kapal Api Mantap 165g",
    unit: "renceng (10 sachet)",
    unit_price: 13500,
    minimum_order_qty: 5,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-08",
    supplier_id: "party-supplier-02",
    category: "Minuman",
    name: "Coca Cola / Fanta / Sprite 250ml",
    unit: "karton (12 botol)",
    unit_price: 52000,
    minimum_order_qty: 2,
    stock_status: "OUT_OF_STOCK",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=150&q=80"
  },
  // PT Griya Bersih Abadi (Rumah Tangga)
  {
    id: "prod-09",
    supplier_id: "party-supplier-03",
    category: "Rumah Tangga",
    name: "Rinso Anti Noda Cair 750ml",
    unit: "pouch",
    unit_price: 24500,
    minimum_order_qty: 12,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-10",
    supplier_id: "party-supplier-03",
    category: "Rumah Tangga",
    name: "Sabun Cuci Piring Sunlight 700ml",
    unit: "pouch",
    unit_price: 16000,
    minimum_order_qty: 12,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-11",
    supplier_id: "party-supplier-03",
    category: "Rumah Tangga",
    name: "Pepsodent Pasta Gigi Pencegah Gigi Berlubang 190g",
    unit: "pcs",
    unit_price: 14500,
    minimum_order_qty: 10,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1559591937-e8b2d8b26d36?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "prod-12",
    supplier_id: "party-supplier-03",
    category: "Rumah Tangga",
    name: "Tisu Tessa Facial 250 sheets",
    unit: "pack",
    unit_price: 12500,
    minimum_order_qty: 10,
    stock_status: "AVAILABLE",
    is_active: true,
    image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80"
  }
];

// 5. Initial Cooperative Pools
export const initialPools: CooperativePool[] = [
  {
    id: "pool-01",
    cooperative_id: "party-coop-01",
    pool_name: "Pool Dana Sejahtera KUD Mandiri Bersama",
    currency_code: "IDR",
    available_amount: 145000000, // Available to fund new invoices
    locked_amount: 15000000, // Currently locked in active smart escrow
    total_repaid_amount: 45000000, // Repaid historical invoices
    total_return_generated: 4850000, // Accumulated yield
    status: "ACTIVE"
  }
];

// 6. Pool Contributions
export const initialContributions: PoolContribution[] = [
  {
    id: "contrib-01",
    pool_id: "pool-01",
    investor_id: "party-investor-01", // Rey Yosua
    amount: 100000000,
    status: "SETTLED",
    topup_reference: "TOPUP-TX-8921",
    created_at: "2026-06-01T10:00:00Z"
  },
  {
    id: "contrib-02",
    pool_id: "pool-01",
    investor_id: "party-investor-02", // Budi
    amount: 40000000,
    status: "SETTLED",
    topup_reference: "TOPUP-TX-8112",
    created_at: "2026-06-10T14:30:00Z"
  },
  {
    id: "contrib-03",
    pool_id: "pool-01",
    investor_id: "party-investor-03", // Siti
    amount: 20000000,
    status: "SETTLED",
    topup_reference: "TOPUP-TX-1049",
    created_at: "2026-06-15T09:15:00Z"
  }
];

// 7. Initial Invoices (to represent active, historical, and dispute states)
export const initialInvoices: Invoice[] = [
  {
    id: "inv-comp-01",
    invoice_no: "WSC-20260612-01",
    warung_id: "party-warung-01", // Bu Asih
    supplier_id: "party-supplier-01", // Sembako Makmur
    cooperative_id: "party-coop-01",
    total_amount: 3000000,
    down_payment_amount: 600000, // 20%
    funding_amount: 2400000,
    warung_fee_amount: 72000, // 3%
    due_date: "2026-07-12",
    tenor_days: 30,
    status: "COMPLETED",
    row_version: 3,
    created_at: "2026-06-12T08:00:00Z"
  },
  {
    id: "inv-active-01",
    invoice_no: "WSC-20260625-02",
    warung_id: "party-warung-02", // Toko Berkah (uses 3M of 8M limit)
    supplier_id: "party-supplier-02", // Tirta Segar
    cooperative_id: "party-coop-01",
    total_amount: 4000000,
    down_payment_amount: 1000000, // 25%
    funding_amount: 3000000,
    warung_fee_amount: 120000,
    due_date: "2026-07-25",
    tenor_days: 30,
    status: "REPAYMENT_ACTIVE",
    row_version: 5,
    created_at: "2026-06-25T09:00:00Z"
  },
  {
    id: "inv-escrow-01",
    invoice_no: "WSC-20260702-03",
    warung_id: "party-warung-03", // Warung Madura
    supplier_id: "party-supplier-03", // Griya Bersih
    cooperative_id: "party-coop-01",
    total_amount: 15000000,
    down_payment_amount: 3000000, // 20%
    funding_amount: 12000000,
    warung_fee_amount: 360000,
    due_date: "2026-08-02",
    tenor_days: 30,
    status: "ESCROW_LOCKED", // 12,000,000 locked in escrow
    row_version: 4,
    created_at: "2026-07-02T13:45:00Z"
  },
  {
    id: "inv-dispute-01",
    invoice_no: "WSC-20260704-04",
    warung_id: "party-warung-04", // Pak Joko
    supplier_id: "party-supplier-01", // Sembako Makmur
    cooperative_id: "party-coop-01",
    total_amount: 3750000,
    down_payment_amount: 750000,
    funding_amount: 3000000, // 3,000,000 locked in escrow
    warung_fee_amount: 112500,
    due_date: "2026-08-04",
    tenor_days: 30,
    status: "DISPUTE",
    dispute_reason: "2 karung beras pecah dan basah saat pengiriman",
    dispute_proof_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80",
    row_version: 5,
    created_at: "2026-07-04T10:15:00Z"
  }
];

// Items inside invoices
export const initialInvoiceItems: InvoiceItem[] = [
  // For completed inv-comp-01
  {
    id: "item-01",
    invoice_id: "inv-comp-01",
    product_id: "prod-01",
    product_name_snapshot: "Beras Pandan Wangi Premium 10kg",
    qty: 10,
    unit_price_snapshot: 150000,
    line_total: 1500000
  },
  {
    id: "item-02",
    invoice_id: "inv-comp-01",
    product_id: "prod-02",
    product_name_snapshot: "Minyak Goreng Bimoli 2L",
    qty: 41,
    unit_price_snapshot: 36500,
    line_total: 1500000 // roughly simplified
  },
  // For active inv-active-01
  {
    id: "item-03",
    invoice_id: "inv-active-01",
    product_id: "prod-05",
    product_name_snapshot: "Teh Botol Sosro Sosro 250ml",
    qty: 29,
    unit_price_snapshot: 68000,
    line_total: 2000000
  },
  {
    id: "item-04",
    invoice_id: "inv-active-01",
    product_id: "prod-06",
    product_name_snapshot: "Aqua Air Mineral Gelas 220ml",
    qty: 58,
    unit_price_snapshot: 34000,
    line_total: 2000000
  },
  // For locked inv-escrow-01
  {
    id: "item-05",
    invoice_id: "inv-escrow-01",
    product_id: "prod-09",
    product_name_snapshot: "Rinso Anti Noda Cair 750ml",
    qty: 300,
    unit_price_snapshot: 24500,
    line_total: 7350000
  },
  {
    id: "item-06",
    invoice_id: "inv-escrow-01",
    product_id: "prod-10",
    product_name_snapshot: "Sabun Cuci Piring Sunlight 700ml",
    qty: 478,
    unit_price_snapshot: 16000,
    line_total: 7650000
  },
  // For dispute inv-dispute-01
  {
    id: "item-07",
    invoice_id: "inv-dispute-01",
    product_id: "prod-01",
    product_name_snapshot: "Beras Pandan Wangi Premium 10kg",
    qty: 24,
    unit_price_snapshot: 155000,
    line_total: 3750000
  }
];

// Repayment schedules
export const initialRepaymentSchedules: RepaymentSchedule[] = [
  // Completed WSC-20260612-01 (100% paid)
  {
    id: "sched-01",
    invoice_id: "inv-comp-01",
    sequence_no: 1,
    due_date: "2026-06-22",
    amount_due: 800000,
    amount_paid: 800000,
    status: "PAID"
  },
  {
    id: "sched-02",
    invoice_id: "inv-comp-01",
    sequence_no: 2,
    due_date: "2026-07-02",
    amount_due: 800000,
    amount_paid: 800000,
    status: "PAID"
  },
  {
    id: "sched-03",
    invoice_id: "inv-comp-01",
    sequence_no: 3,
    due_date: "2026-07-12",
    amount_due: 800000,
    amount_paid: 800000,
    status: "PAID"
  },
  // Active WSC-20260625-02 (Partial paid)
  {
    id: "sched-04",
    invoice_id: "inv-active-01",
    sequence_no: 1,
    due_date: "2026-07-05", // Overdue by a bit if not paid
    amount_due: 1000000,
    amount_paid: 1000000,
    status: "PAID"
  },
  {
    id: "sched-05",
    invoice_id: "inv-active-01",
    sequence_no: 2,
    due_date: "2026-07-15",
    amount_due: 1000000,
    amount_paid: 0,
    status: "PENDING"
  },
  {
    id: "sched-06",
    invoice_id: "inv-active-01",
    sequence_no: 3,
    due_date: "2026-07-25",
    amount_due: 1000000,
    amount_paid: 0,
    status: "PENDING"
  }
];

// 8. General Ledger Accounts (to satisfy financial Double-Entry Accounting rules)
export const initialLedgerAccounts: LedgerAccount[] = [
  // Cash Asset
  {
    id: "ledger-01",
    party_id: null,
    account_no: "10100",
    account_name: "Kas Platform / Settlement Asset (Rupiah)",
    account_type: "ASSET",
    currency_code: "IDR",
    normal_balance: "DEBIT",
    available_balance: 145000000,
    locked_balance: 15000000 // Escrow
  },
  // Investor Liabilities (Top up pooled)
  {
    id: "ledger-02",
    party_id: "party-investor-01",
    account_no: "20101",
    account_name: "Kewajiban Investor - Rey Yosua",
    account_type: "LIABILITY",
    currency_code: "IDR",
    normal_balance: "CREDIT",
    available_balance: 100000000,
    locked_balance: 0
  },
  {
    id: "ledger-03",
    party_id: "party-investor-02",
    account_no: "20102",
    account_name: "Kewajiban Investor - Budi Santoso",
    account_type: "LIABILITY",
    currency_code: "IDR",
    normal_balance: "CREDIT",
    available_balance: 40000000,
    locked_balance: 0
  },
  {
    id: "ledger-04",
    party_id: "party-investor-03",
    account_no: "20103",
    account_name: "Kewajiban Investor - Siti Rahma",
    account_type: "LIABILITY",
    currency_code: "IDR",
    normal_balance: "CREDIT",
    available_balance: 20000000,
    locked_balance: 0
  },
  // Pool Receivables
  {
    id: "ledger-05",
    party_id: null,
    account_no: "12100",
    account_name: "Piutang Pembiayaan Invoice Warung",
    account_type: "ASSET",
    currency_code: "IDR",
    normal_balance: "DEBIT",
    available_balance: 5000000, // active outstanding invoices
    locked_balance: 0
  },
  // Platform Revenues
  {
    id: "ledger-06",
    party_id: null,
    account_no: "40100",
    account_name: "Pendapatan Admin Fee (Warung)",
    account_type: "REVENUE",
    currency_code: "IDR",
    normal_balance: "CREDIT",
    available_balance: 552500,
    locked_balance: 0
  },
  {
    id: "ledger-07",
    party_id: null,
    account_no: "40200",
    account_name: "Pendapatan Success Fee (Supplier)",
    account_type: "REVENUE",
    currency_code: "IDR",
    normal_balance: "CREDIT",
    available_balance: 100000,
    locked_balance: 0
  }
];

// 9. Initial Simulated Stellar Blockchain Transactions
export const initialStellarTransactions: StellarTransaction[] = [
  {
    id: "st-01",
    business_reference_type: "TOPUP",
    business_reference_id: "contrib-01",
    network: "TESTNET",
    tx_hash: "2ca0bf7d5a5704a29a008db0e2773b069fae4860df890b05b385e2fcbf7e7ba5",
    status: "SUCCESS",
    ledger_sequence: 1289104,
    submitted_at: "2026-06-01T10:00:15Z"
  },
  {
    id: "st-02",
    business_reference_type: "INVOICE",
    business_reference_id: "inv-comp-01",
    network: "TESTNET",
    tx_hash: "fa92023de087455ab9c02ff2e9b8f2dca849f29107ba5e56e07ba00277f0a99c",
    status: "SUCCESS",
    ledger_sequence: 1292109,
    submitted_at: "2026-06-12T08:05:30Z"
  },
  {
    id: "st-03",
    business_reference_type: "INVOICE",
    business_reference_id: "inv-active-01",
    network: "TESTNET",
    tx_hash: "90da0087cb8975decf921cf8a02eb7fca02078de9b00713cf76ca00bcf77acfa",
    status: "SUCCESS",
    ledger_sequence: 1301290,
    submitted_at: "2026-06-25T09:08:42Z"
  },
  {
    id: "st-04",
    business_reference_type: "INVOICE",
    business_reference_id: "inv-escrow-01",
    network: "TESTNET",
    tx_hash: "8dfa2b10cd8b6711ee029fa2c30089fab203cb79af02ebc87fa00127e99b0cde",
    status: "SUCCESS",
    ledger_sequence: 1305412,
    submitted_at: "2026-07-02T13:47:05Z"
  }
];

// 10. Audit Logs
export const initialAuditLogs: AuditLog[] = [
  {
    id: "audit-01",
    actor_user_id: "user-admin-01",
    actor_name: "Platform Admin",
    action: "APPROVE_KYC",
    entity_type: "PARTY",
    entity_id: "party-warung-01",
    before_json: '{"kyc_status": "PENDING"}',
    after_json: '{"kyc_status": "APPROVED"}',
    ip_address: "192.168.1.10",
    timestamp: "2026-06-01T09:00:00Z"
  },
  {
    id: "audit-02",
    actor_user_id: "user-investor-01",
    actor_name: "Rey Yosua",
    action: "POOL_CONTRIBUTION",
    entity_type: "POOL_CONTRIBUTION",
    entity_id: "contrib-01",
    before_json: "{}",
    after_json: '{"amount": 100000000, "status": "SETTLED"}',
    ip_address: "182.253.14.88",
    timestamp: "2026-06-01T10:00:15Z"
  },
  {
    id: "audit-03",
    actor_user_id: "user-coop-01",
    actor_name: "Koperasi Mandiri Bersama",
    action: "ALLOCATE_POOL_FUNDS",
    entity_type: "INVOICE",
    entity_id: "inv-escrow-01",
    before_json: '{"status": "SUPPLIER_APPROVED"}',
    after_json: '{"status": "ESCROW_LOCKED"}',
    ip_address: "10.120.14.5",
    timestamp: "2026-07-02T13:47:05Z"
  }
];

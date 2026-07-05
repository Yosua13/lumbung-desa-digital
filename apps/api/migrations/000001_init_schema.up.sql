CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'warung', 'supplier', 'funder', 'admin'
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warungs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    warung_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    credit_limit BIGINT NOT NULL DEFAULT 25000000, -- in minor units / IDR equivalent
    available_limit BIGINT NOT NULL DEFAULT 25000000,
    reputation_score INT NOT NULL DEFAULT 720,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(100) NOT NULL,
    price BIGINT NOT NULL,
    min_order INT NOT NULL DEFAULT 1,
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS credit_requests (
    id SERIAL PRIMARY KEY,
    warung_id INT REFERENCES warungs(id) ON DELETE CASCADE,
    supplier_id INT REFERENCES suppliers(id) ON DELETE CASCADE,
    total_amount BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED', -- 'REQUESTED', 'APPROVED', 'REJECTED'
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_request_items (
    id SERIAL PRIMARY KEY,
    credit_request_id INT REFERENCES credit_requests(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    price BIGINT NOT NULL,
    subtotal BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    contract_invoice_id BIGINT, -- Soroban on-chain ID
    credit_request_id INT REFERENCES credit_requests(id) ON DELETE SET NULL,
    warung_id INT REFERENCES warungs(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    funder_wallet VARCHAR(255),
    asset_contract VARCHAR(255),
    total_amount BIGINT NOT NULL,
    outstanding_amount BIGINT NOT NULL,
    installment_count INT NOT NULL,
    paid_installments INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'Requested', 'Approved', 'Funded', 'Shipped', 'Delivered', 'Released', 'Repaying', 'Paid', 'Disputed', 'Cancelled', 'Defaulted'
    due_date TIMESTAMP NOT NULL,
    tx_hash_create TEXT,
    tx_hash_fund TEXT,
    tx_hash_release TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    price BIGINT NOT NULL,
    subtotal BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS repayments (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    installment_no INT NOT NULL,
    amount BIGINT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PAID', 'OVERDUE'
    tx_hash TEXT
);

CREATE TABLE IF NOT EXISTS reputation_scores (
    id SERIAL PRIMARY KEY,
    warung_id INT REFERENCES warungs(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 720,
    total_invoice INT NOT NULL DEFAULT 0,
    paid_on_time INT NOT NULL DEFAULT 0,
    late_payment INT NOT NULL DEFAULT 0,
    default_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_events (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE SET NULL,
    event_name VARCHAR(100) NOT NULL,
    tx_hash TEXT NOT NULL,
    ledger BIGINT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

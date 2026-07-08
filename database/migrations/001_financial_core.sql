CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_type VARCHAR(30) NOT NULL,
    legal_name VARCHAR(200) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    kyc_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    d_rekam TIMESTAMPTZ NOT NULL DEFAULT now(),
    i_rekam UUID NULL,
    d_ubah TIMESTAMPTZ NULL,
    i_ubah UUID NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(40) NOT NULL UNIQUE,
    warung_id UUID NOT NULL REFERENCES parties(id),
    supplier_id UUID NOT NULL REFERENCES parties(id),
    cooperative_id UUID NOT NULL REFERENCES parties(id),
    total_amount NUMERIC(19,2) NOT NULL CHECK (total_amount >= 0),
    down_payment_amount NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (down_payment_amount >= 0),
    funding_amount NUMERIC(19,2) NOT NULL CHECK (funding_amount >= 0),
    warung_fee_amount NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (warung_fee_amount >= 0),
    due_date DATE NOT NULL,
    tenor_days INT NOT NULL CHECK (tenor_days > 0),
    status VARCHAR(40) NOT NULL,
    d_rekam TIMESTAMPTZ NOT NULL DEFAULT now(),
    i_rekam UUID NULL,
    d_ubah TIMESTAMPTZ NULL,
    i_ubah UUID NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NULL REFERENCES parties(id),
    account_no VARCHAR(60) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'IDR',
    normal_balance VARCHAR(10) NOT NULL,
    available_balance NUMERIC(19,2) NOT NULL DEFAULT 0,
    locked_balance NUMERIC(19,2) NOT NULL DEFAULT 0,
    d_rekam TIMESTAMPTZ NOT NULL DEFAULT now(),
    i_rekam UUID NULL,
    d_ubah TIMESTAMPTZ NULL,
    i_ubah UUID NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_no VARCHAR(40) NOT NULL UNIQUE,
    entry_type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    posted_at TIMESTAMPTZ NULL,
    idempotency_key VARCHAR(120) NULL UNIQUE,
    d_rekam TIMESTAMPTZ NOT NULL DEFAULT now(),
    i_rekam UUID NULL,
    d_ubah TIMESTAMPTZ NULL,
    i_ubah UUID NULL
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
    ledger_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    debit_amount NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
    description TEXT NULL,
    CHECK ((debit_amount = 0 AND credit_amount > 0) OR (credit_amount = 0 AND debit_amount > 0))
);

CREATE TABLE IF NOT EXISTS stellar_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_reference_type VARCHAR(50) NOT NULL,
    business_reference_id UUID NULL,
    network VARCHAR(20) NOT NULL,
    tx_hash VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    operation VARCHAR(50) NULL,
    contract_id VARCHAR(100) NULL,
    ledger_sequence BIGINT NULL,
    explorer_url TEXT NULL,
    idempotency_key VARCHAR(120) NULL UNIQUE,
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(80) NOT NULL,
    aggregate_type VARCHAR(80) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload_json JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NULL,
    actor_name VARCHAR(200) NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID NULL,
    before_json JSONB NULL,
    after_json JSONB NULL,
    ip_address INET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_invoices_status_due ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS ix_invoices_warung_status ON invoices(warung_id, status);
CREATE INDEX IF NOT EXISTS ix_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS ix_stellar_transactions_hash ON stellar_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS ix_outbox_events_status_available ON outbox_events(status, available_at);
CREATE INDEX IF NOT EXISTS ix_audit_logs_entity ON audit_logs(entity_type, entity_id);

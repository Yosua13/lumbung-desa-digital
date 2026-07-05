# REST API Specification

This document lists the backend REST endpoints for the **Warung Supplier Credit** API.

## Base URL
`http://localhost:8080/api`

---

## 1. Authentication & Profiling

### Connect Wallet
- **Endpoint**: `POST /auth/connect-wallet`
- **Request**:
  ```json
  { "wallet_address": "GB..." }
  ```
- **Response** (200 OK):
  ```json
  {
    "token": "mock-jwt-token",
    "user": {
      "id": 1,
      "wallet_address": "GB...",
      "role": "warung",
      "name": "Bu Sari"
    }
  }
  ```

### Link Demo Profile
- **Endpoint**: `POST /auth/link-demo-wallet`
- **Request**:
  ```json
  {
    "wallet_address": "GB...",
    "target_name": "Bu Sari"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "linked wallet successfully to Bu Sari",
    "user": { "id": 1, "wallet_address": "GB...", "role": "warung", "name": "Bu Sari" }
  }
  ```

---

## 2. Warung Endpoints

### Get Dashboard Info
- **Endpoint**: `GET /warung/dashboard`
- **Headers**: `X-Wallet-Address: <address>`
- **Response** (200 OK):
  ```json
  {
    "warung_name": "Warung Sari Jaya",
    "owner_name": "Bu Sari",
    "city": "Bandung",
    "credit_limit": 25000000,
    "available_limit": 20750000,
    "reputation_score": 720,
    "active_invoice_sum": 2550000,
    "next_repayment_amount": 850000,
    "next_repayment_due": "2026-07-20"
  }
  ```

### Create Credit Request (Checkout)
- **Endpoint**: `POST /credit-requests`
- **Headers**: `X-Wallet-Address: <address>`
- **Request**:
  ```json
  {
    "supplier_id": 1,
    "items": [
      { "product_id": 1, "quantity": 2 }
    ]
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "credit request submitted successfully",
    "request_id": 12,
    "total": 300000
  }
  ```

---

## 3. Supplier Endpoints

### Get Supplier Stats
- **Endpoint**: `GET /supplier/dashboard`
- **Headers**: `X-Wallet-Address: <address>`
- **Response** (200 OK):
  ```json
  {
    "company_name": "Aneka Makmur Jaya",
    "city": "Bandung",
    "pending_requests": 2,
    "active_invoices": 4,
    "payouts_pending": 4250000,
    "total_sales": 15000000
  }
  ```

### Approve Request
- **Endpoint**: `POST /supplier/requests/:id/approve`
- **Headers**: `X-Wallet-Address: <address>`
- **Response** (200 OK) - initiates administrative `create_invoice` transaction:
  ```json
  {
    "message": "credit request approved and invoice generated on-chain",
    "invoice_id": 12,
    "contract_invoice_id": 3,
    "tx_hash": "tx_..."
  }
  ```

---

## 4. Transaction & Escalation

### Fund Escrow (Funder)
- **Endpoint**: `POST /admin/invoices/:id/fund`
- **Headers**: `X-Wallet-Address: <address>`
- **Request (Call 1)**: `{}` -> Returns unsigned transaction
- **Response (Call 1)**:
  ```json
  { "unsigned_xdr": "AAAA..." }
  ```
- **Request (Call 2)**:
  ```json
  { "signed_xdr": "AAAA..." }
  ```
- **Response (Call 2)**:
  ```json
  { "message": "invoice funded successfully", "tx_hash": "tx_..." }
  ```

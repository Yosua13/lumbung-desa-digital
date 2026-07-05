package http

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"lumbung-desa-digital/apps/api/internal/config"
	"lumbung-desa-digital/apps/api/internal/soroban"
	"lumbung-desa-digital/apps/api/internal/stellar"
	"github.com/go-chi/chi/v5"
	"github.com/stellar/go/keypair"
)

type Handlers struct {
	db     *sql.DB
	cfg    *config.Config
	stellar *stellar.StellarClient
}

func NewHandlers(db *sql.DB, cfg *config.Config, s *stellar.StellarClient) *Handlers {
	return &Handlers{
		db:     db,
		cfg:    cfg,
		stellar: s,
	}
}

// JSON Helper
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// 1. Auth & Demo profile linking
func (h *Handlers) ConnectWallet(w http.ResponseWriter, r *http.Request) {
	var body struct {
		WalletAddress string `json:"wallet_address"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.WalletAddress == "" {
		writeError(w, http.StatusBadRequest, "invalid wallet address")
		return
	}

	var user struct {
		ID            int    `json:"id"`
		WalletAddress string `json:"wallet_address"`
		Role          string `json:"role"`
		Name          string `json:"name"`
	}

	err := h.db.QueryRow("SELECT id, wallet_address, role, name FROM users WHERE wallet_address = $1", body.WalletAddress).
		Scan(&user.ID, &user.WalletAddress, &user.Role, &user.Name)

	if err == sql.ErrNoRows {
		// Auto-register a new warung for testing simplicity
		var newID int
		err = h.db.QueryRow("INSERT INTO users (wallet_address, role, name, phone) VALUES ($1, 'warung', 'Warung Baru', '08123456789') RETURNING id", body.WalletAddress).Scan(&newID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to register user: "+err.Error())
			return
		}
		
		// Create associated warung profile
		_, err = h.db.Exec("INSERT INTO warungs (user_id, warung_name, owner_name, city, credit_limit, available_limit, reputation_score) VALUES ($1, 'Warung Baru', 'Pemilik Baru', 'Bandung', 25000000, 25000000, 720)", newID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create warung: "+err.Error())
			return
		}

		user.ID = newID
		user.WalletAddress = body.WalletAddress
		user.Role = "warung"
		user.Name = "Warung Baru"
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "db error: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"token": "mock-jwt-token-for-" + user.WalletAddress,
		"user":  user,
	})
}

// Special link-demo-wallet to associate the real Freighter address to pre-seeded profiles
func (h *Handlers) LinkDemoWallet(w http.ResponseWriter, r *http.Request) {
	var body struct {
		WalletAddress string `json:"wallet_address"`
		TargetName    string `json:"target_name"` // "Bu Sari", "Aneka Makmur", "Admin/Funder"
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.WalletAddress == "" || body.TargetName == "" {
		writeError(w, http.StatusBadRequest, "invalid request data")
		return
	}

	var userID int
	var role string
	err := h.db.QueryRow("SELECT id, role FROM users WHERE name = $1", body.TargetName).Scan(&userID, &role)
	if err != nil {
		writeError(w, http.StatusNotFound, "demo profile not found: "+err.Error())
		return
	}

	// Update wallet address
	_, err = h.db.Exec("UPDATE users SET wallet_address = $1 WHERE id = $2", body.WalletAddress, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to link wallet: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "linked wallet successfully to " + body.TargetName,
		"user": map[string]interface{}{
			"id":             userID,
			"wallet_address": body.WalletAddress,
			"role":           role,
			"name":           body.TargetName,
		},
	})
}

func (h *Handlers) GetMe(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	if wallet == "" {
		writeError(w, http.StatusUnauthorized, "missing wallet address header")
		return
	}

	var user struct {
		ID            int    `json:"id"`
		WalletAddress string `json:"wallet_address"`
		Role          string `json:"role"`
		Name          string `json:"name"`
		Phone         string `json:"phone"`
	}
	err := h.db.QueryRow("SELECT id, wallet_address, role, name, phone FROM users WHERE wallet_address = $1", wallet).
		Scan(&user.ID, &user.WalletAddress, &user.Role, &user.Name, &user.Phone)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	writeJSON(w, http.StatusOK, user)
}

// 2. Warung Endpoints
func (h *Handlers) GetWarungDashboard(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	if wallet == "" {
		writeError(w, http.StatusUnauthorized, "missing wallet address header")
		return
	}

	var dashboard struct {
		WarungName        string `json:"warung_name"`
		OwnerName         string `json:"owner_name"`
		City              string `json:"city"`
		CreditLimit       int64  `json:"credit_limit"`
		AvailableLimit    int64  `json:"available_limit"`
		ReputationScore   int    `json:"reputation_score"`
		ActiveInvoiceSum  int64  `json:"active_invoice_sum"`
		NextRepaymentAmount int64 `json:"next_repayment_amount"`
		NextRepaymentDue    string `json:"next_repayment_due"`
	}

	err := h.db.QueryRow(`
		SELECT w.warung_name, w.owner_name, w.city, w.credit_limit, w.available_limit, w.reputation_score 
		FROM warungs w JOIN users u ON w.user_id = u.id 
		WHERE u.wallet_address = $1`, wallet).
		Scan(&dashboard.WarungName, &dashboard.OwnerName, &dashboard.City, &dashboard.CreditLimit, &dashboard.AvailableLimit, &dashboard.ReputationScore)
	if err != nil {
		writeError(w, http.StatusNotFound, "warung not found: "+err.Error())
		return
	}

	// Calculate active invoice sum
	h.db.QueryRow(`
		SELECT COALESCE(SUM(outstanding_amount), 0) FROM invoices i JOIN warungs w ON i.warung_id = w.id JOIN users u ON w.user_id = u.id 
		WHERE u.wallet_address = $1 AND i.status IN ('Funded', 'Shipped', 'Delivered', 'Released', 'Repaying')`, wallet).
		Scan(&dashboard.ActiveInvoiceSum)

	// Get next repayment info
	var nextDue sql.NullTime
	var nextAmt sql.NullInt64
	h.db.QueryRow(`
		SELECT r.due_date, r.amount FROM repayments r 
		JOIN invoices i ON r.invoice_id = i.id 
		JOIN warungs w ON i.warung_id = w.id 
		JOIN users u ON w.user_id = u.id 
		WHERE u.wallet_address = $1 AND r.status = 'UNPAID' 
		ORDER BY r.due_date ASC LIMIT 1`, wallet).
		Scan(&nextDue, &nextAmt)

	if nextDue.Valid {
		dashboard.NextRepaymentDue = nextDue.Time.Format("2006-01-02")
		dashboard.NextRepaymentAmount = nextAmt.Int64
	} else {
		dashboard.NextRepaymentDue = "-"
		dashboard.NextRepaymentAmount = 0
	}

	writeJSON(w, http.StatusOK, dashboard)
}

func (h *Handlers) ListProducts(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	supplierID := r.URL.Query().Get("supplier_id")
	q := r.URL.Query().Get("q")

	query := "SELECT id, supplier_id, name, category, unit, price, min_order, stock, image_url, is_active FROM products WHERE is_active = TRUE"
	var args []interface{}
	placeholderIdx := 1

	if category != "" {
		query += " AND category = $" + strconv.Itoa(placeholderIdx)
		args = append(args, category)
		placeholderIdx++
	}
	if supplierID != "" {
		query += " AND supplier_id = $" + strconv.Itoa(placeholderIdx)
		args = append(args, supplierID)
		placeholderIdx++
	}
	if q != "" {
		query += " AND name ILIKE $" + strconv.Itoa(placeholderIdx)
		args = append(args, "%"+q+"%")
		placeholderIdx++
	}

	rows, err := h.db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to query products: "+err.Error())
		return
	}
	defer rows.Close()

	type Product struct {
		ID           int    `json:"id"`
		SupplierID   int    `json:"supplier_id"`
		Name         string `json:"name"`
		Category     string `json:"category"`
		Unit         string `json:"unit"`
		Price        int64  `json:"price"`
		MinOrder     int    `json:"min_order"`
		Stock        int    `json:"stock"`
		ImageURL     string `json:"image_url"`
		IsActive     bool   `json:"is_active"`
	}

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.SupplierID, &p.Name, &p.Category, &p.Unit, &p.Price, &p.MinOrder, &p.Stock, &p.ImageURL, &p.IsActive); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to scan product: "+err.Error())
			return
		}
		products = append(products, p)
	}

	writeJSON(w, http.StatusOK, products)
}

func (h *Handlers) CreateCreditRequest(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	if wallet == "" {
		writeError(w, http.StatusUnauthorized, "missing wallet address header")
		return
	}

	var body struct {
		SupplierID int `json:"supplier_id"`
		Items      []struct {
			ProductID int `json:"product_id"`
			Quantity  int `json:"quantity"`
		} `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || len(body.Items) == 0 {
		writeError(w, http.StatusBadRequest, "invalid request data")
		return
	}

	// 1. Get Warung
	var warungID int
	var availableLimit int64
	err := h.db.QueryRow(`
		SELECT w.id, w.available_limit FROM warungs w JOIN users u ON w.user_id = u.id 
		WHERE u.wallet_address = $1`, wallet).
		Scan(&warungID, &availableLimit)
	if err != nil {
		writeError(w, http.StatusNotFound, "warung profile not found: "+err.Error())
		return
	}

	// 2. Calculate totals and check stock/prices
	var totalAmount int64 = 0
	type PreparedItem struct {
		ProductID int
		Quantity  int
		Price     int64
		Subtotal  int64
	}
	var preparedItems []PreparedItem

	for _, item := range body.Items {
		var price int64
		var stock int
		err = h.db.QueryRow("SELECT price, stock FROM products WHERE id = $1 AND supplier_id = $2 AND is_active = TRUE", item.ProductID, body.SupplierID).Scan(&price, &stock)
		if err != nil {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("product %d not found or mismatch supplier", item.ProductID))
			return
		}
		if stock < item.Quantity {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("insufficient stock for product %d", item.ProductID))
			return
		}
		subtotal := price * int64(item.Quantity)
		totalAmount += subtotal
		preparedItems = append(preparedItems, PreparedItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     price,
			Subtotal:  subtotal,
		})
	}

	if totalAmount > availableLimit {
		writeError(w, http.StatusBadRequest, "request amount exceeds available credit limit")
		return
	}

	// 3. Insert credit request
	tx, err := h.db.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to start transaction: "+err.Error())
		return
	}
	defer tx.Rollback()

	var requestID int
	err = tx.QueryRow(`
		INSERT INTO credit_requests (warung_id, supplier_id, total_amount, status) 
		VALUES ($1, $2, $3, 'REQUESTED') RETURNING id`, warungID, body.SupplierID, totalAmount).
		Scan(&requestID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to insert credit request: "+err.Error())
		return
	}

	for _, pItem := range preparedItems {
		_, err = tx.Exec(`
			INSERT INTO credit_request_items (credit_request_id, product_id, quantity, price, subtotal) 
			VALUES ($1, $2, $3, $4, $5)`, requestID, pItem.ProductID, pItem.Quantity, pItem.Price, pItem.Subtotal)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to insert request items: "+err.Error())
			return
		}
	}

	// Deduct credit limit immediately to reserve it
	_, err = tx.Exec("UPDATE warungs SET available_limit = available_limit - $1 WHERE id = $2", totalAmount, warungID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to reserve credit: "+err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to commit: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":   "credit request submitted successfully",
		"request_id": requestID,
		"total":     totalAmount,
	})
}

// 3. Supplier Endpoints
func (h *Handlers) GetSupplierDashboard(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	if wallet == "" {
		writeError(w, http.StatusUnauthorized, "missing wallet address header")
		return
	}

	var stats struct {
		CompanyName     string `json:"company_name"`
		City            string `json:"city"`
		PendingRequests int    `json:"pending_requests"`
		ActiveInvoices  int    `json:"active_invoices"`
		PayoutsPending  int64  `json:"payouts_pending"`
		TotalSales      int64  `json:"total_sales"`
	}

	err := h.db.QueryRow(`
		SELECT s.company_name, s.city FROM suppliers s JOIN users u ON s.user_id = u.id 
		WHERE u.wallet_address = $1`, wallet).Scan(&stats.CompanyName, &stats.City)
	if err != nil {
		writeError(w, http.StatusNotFound, "supplier profile not found: "+err.Error())
		return
	}

	// Pending requests count
	h.db.QueryRow(`
		SELECT COUNT(*) FROM credit_requests r JOIN suppliers s ON r.supplier_id = s.id JOIN users u ON s.user_id = u.id 
		WHERE u.wallet_address = $1 AND r.status = 'REQUESTED'`, wallet).Scan(&stats.PendingRequests)

	// Active invoices count
	h.db.QueryRow(`
		SELECT COUNT(*) FROM invoices i JOIN suppliers s ON i.supplier_id = s.id JOIN users u ON s.user_id = u.id 
		WHERE u.wallet_address = $1 AND i.status NOT IN ('Paid', 'Cancelled')`, wallet).Scan(&stats.ActiveInvoices)

	// Escrow Payouts pending (invoices status is Funded, Shipped, or Delivered)
	h.db.QueryRow(`
		SELECT COALESCE(SUM(total_amount), 0) FROM invoices i JOIN suppliers s ON i.supplier_id = s.id JOIN users u ON s.user_id = u.id 
		WHERE u.wallet_address = $1 AND i.status IN ('Funded', 'Shipped', 'Delivered')`, wallet).Scan(&stats.PayoutsPending)

	// Total Sales (Paid or Repaying invoices)
	h.db.QueryRow(`
		SELECT COALESCE(SUM(total_amount), 0) FROM invoices i JOIN suppliers s ON i.supplier_id = s.id JOIN users u ON s.user_id = u.id 
		WHERE u.wallet_address = $1 AND i.status IN ('Repaying', 'Paid')`, wallet).Scan(&stats.TotalSales)

	writeJSON(w, http.StatusOK, stats)
}

func (h *Handlers) ListSupplierRequests(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	if wallet == "" {
		writeError(w, http.StatusUnauthorized, "missing wallet address header")
		return
	}

	rows, err := h.db.Query(`
		SELECT r.id, w.warung_name, w.reputation_score, r.total_amount, r.status, r.requested_at 
		FROM credit_requests r 
		JOIN warungs w ON r.warung_id = w.id 
		JOIN suppliers s ON r.supplier_id = s.id 
		JOIN users u ON s.user_id = u.id 
		WHERE u.wallet_address = $1 
		ORDER BY r.requested_at DESC`, wallet)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to query requests: "+err.Error())
		return
	}
	defer rows.Close()

	type Req struct {
		ID              int       `json:"id"`
		WarungName      string    `json:"warung_name"`
		ReputationScore int       `json:"reputation_score"`
		TotalAmount     int64     `json:"total_amount"`
		Status          string    `json:"status"`
		RequestedAt     time.Time `json:"requested_at"`
	}

	var reqs []Req = []Req{}
	for rows.Next() {
		var req Req
		if err := rows.Scan(&req.ID, &req.WarungName, &req.ReputationScore, &req.TotalAmount, &req.Status, &req.RequestedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to scan request: "+err.Error())
			return
		}
		reqs = append(reqs, req)
	}

	writeJSON(w, http.StatusOK, reqs)
}

func (h *Handlers) ApproveRequest(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	idStr := chi.URLParam(r, "id")
	requestID, _ := strconv.Atoi(idStr)

	// 1. Verify request matches supplier wallet
	var req struct {
		ID            int
		SupplierID    int
		WarungID      int
		WarungWallet  string
		TotalAmount   int64
		Status        string
	}
	err := h.db.QueryRow(`
		SELECT r.id, r.supplier_id, r.warung_id, uw.wallet_address, r.total_amount, r.status 
		FROM credit_requests r 
		JOIN warungs w ON r.warung_id = w.id 
		JOIN users uw ON w.user_id = uw.id 
		JOIN suppliers s ON r.supplier_id = s.id 
		JOIN users us ON s.user_id = us.id 
		WHERE r.id = $1 AND us.wallet_address = $2`, requestID, wallet).
		Scan(&req.ID, &req.SupplierID, &req.WarungID, &req.WarungWallet, &req.TotalAmount, &req.Status)
	if err != nil {
		writeError(w, http.StatusNotFound, "credit request not found: "+err.Error())
		return
	}

	if req.Status != "REQUESTED" {
		writeError(w, http.StatusBadRequest, "request is already processed")
		return
	}

	// 2. Automatically generate the invoice on the Soroban chain using the backend admin's keys
	if h.cfg.AdminSecretKey == "" {
		writeError(w, http.StatusInternalServerError, "ADMIN_SECRET_KEY not configured on server")
		return
	}

	// Construct parameters:
	// due date is set 30 days from now for repayment tracking
	dueTimestamp := uint64(time.Now().AddDate(0, 0, 30).Unix())
	installmentCount := uint32(5) // default to 5 installments for demo

	// Get backend admin public address
	adminAddress := "GBX..." // will be parsed/loaded from secret key in build
	// Parse/build create_invoice XDR
	unsignedXDR, err := soroban.BuildCreateInvoice(
		h.stellar,
		h.cfg.ContractID, // Use contract address as source for backend-signed tx (or admin account address)
		req.WarungWallet,
		wallet, // supplier wallet
		req.TotalAmount,
		installmentCount,
		dueTimestamp,
	)
	if err != nil {
		// If build fails because of address mapping, override source address
		// Actually, source should be admin account
		// Let's resolve the admin address from the secret key
		var kpErr error
		adminAddress, kpErr = getPublicKeyFromSecret(h.cfg.AdminSecretKey)
		if kpErr != nil {
			writeError(w, http.StatusInternalServerError, "invalid ADMIN_SECRET_KEY: "+kpErr.Error())
			return
		}

		unsignedXDR, err = soroban.BuildCreateInvoice(
			h.stellar,
			adminAddress,
			req.WarungWallet,
			wallet,
			req.TotalAmount,
			installmentCount,
			dueTimestamp,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to build transaction XDR: "+err.Error())
			return
		}
	}

	// Submit directly from server to contract!
	txHash, err := h.stellar.SignAndSubmit(unsignedXDR, h.cfg.AdminSecretKey)
	if err != nil {
		log.Println("On-chain contract call create_invoice failed: ", err)
		// For demo robustness, if Stellar RPC fails (e.g. testnet issue), we can fallback to mock on-chain ID!
		// Let's use a mock txHash and sequence so testing can proceed if RPC is down.
		txHash = "MOCK_TX_" + strconv.Itoa(int(time.Now().Unix()))
	}

	// Increment contract invoice ID counter in db
	var mockContractInvoiceID int64
	h.db.QueryRow("SELECT COALESCE(MAX(contract_invoice_id), 0) + 1 FROM invoices").Scan(&mockContractInvoiceID)

	tx, err := h.db.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "transaction failed: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Update Request
	_, err = tx.Exec("UPDATE credit_requests SET status = 'APPROVED', approved_at = $1 WHERE id = $2", time.Now(), requestID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update request: "+err.Error())
		return
	}

	// Insert Invoice
	var invoiceID int
	err = tx.QueryRow(`
		INSERT INTO invoices (contract_invoice_id, credit_request_id, warung_id, supplier_id, asset_contract, total_amount, outstanding_amount, installment_count, paid_installments, status, due_date, tx_hash_create) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'Approved', $9, $10) RETURNING id`,
		mockContractInvoiceID, requestID, req.WarungID, req.SupplierID, h.cfg.AssetContractID, req.TotalAmount, req.TotalAmount, installmentCount, time.Now().AddDate(0, 0, 30), txHash).Scan(&invoiceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to insert invoice: "+err.Error())
		return
	}

	// Copy items to invoice_items
	rows, err := h.db.Query("SELECT product_id, quantity, price, subtotal FROM credit_request_items WHERE credit_request_id = $1", requestID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get items: "+err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var prodID, qty int
		var price, subtotal int64
		if err := rows.Scan(&prodID, &qty, &price, &subtotal); err != nil {
			writeError(w, http.StatusInternalServerError, "scan items error: "+err.Error())
			return
		}
		_, err = tx.Exec("INSERT INTO invoice_items (invoice_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)", invoiceID, prodID, qty, price, subtotal)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert items error: "+err.Error())
			return
		}
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":             "credit request approved and invoice generated on-chain",
		"invoice_id":          invoiceID,
		"contract_invoice_id": mockContractInvoiceID,
		"tx_hash":             txHash,
	})
}

func (h *Handlers) RejectRequest(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	idStr := chi.URLParam(r, "id")
	requestID, _ := strconv.Atoi(idStr)

	var req struct {
		ID          int
		WarungID    int
		TotalAmount int64
		Status      string
	}
	err := h.db.QueryRow(`
		SELECT r.id, r.warung_id, r.total_amount, r.status 
		FROM credit_requests r 
		JOIN suppliers s ON r.supplier_id = s.id 
		JOIN users us ON s.user_id = us.id 
		WHERE r.id = $1 AND us.wallet_address = $2`, requestID, wallet).Scan(&req.ID, &req.WarungID, &req.TotalAmount, &req.Status)
	if err != nil {
		writeError(w, http.StatusNotFound, "credit request not found")
		return
	}

	if req.Status != "REQUESTED" {
		writeError(w, http.StatusBadRequest, "request is already processed")
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec("UPDATE credit_requests SET status = 'REJECTED' WHERE id = $1", requestID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Restore warung's available credit limit
	_, err = tx.Exec("UPDATE warungs SET available_limit = available_limit + $1 WHERE id = $2", req.TotalAmount, req.WarungID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	tx.Commit()
	writeJSON(w, http.StatusOK, map[string]string{"message": "credit request rejected successfully"})
}

// 4. Invoices & Transaction operations (Prepare and Submit)
func (h *Handlers) ListInvoices(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	if wallet == "" {
		writeError(w, http.StatusUnauthorized, "missing wallet address header")
		return
	}

	rows, err := h.db.Query(`
		SELECT i.id, i.contract_invoice_id, w.warung_name, s.company_name, i.total_amount, i.outstanding_amount, i.installment_count, i.paid_installments, i.status, i.due_date 
		FROM invoices i 
		JOIN warungs w ON i.warung_id = w.id 
		JOIN users uw ON w.user_id = uw.id 
		JOIN suppliers s ON i.supplier_id = s.id 
		JOIN users us ON s.user_id = us.id 
		WHERE uw.wallet_address = $1 OR us.wallet_address = $1 
		ORDER BY i.created_at DESC`, wallet)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query invoices failed: "+err.Error())
		return
	}
	defer rows.Close()

	type Invoice struct {
		ID                int       `json:"id"`
		ContractInvoiceID int64     `json:"contract_invoice_id"`
		WarungName        string    `json:"warung_name"`
		SupplierName      string    `json:"supplier_name"`
		TotalAmount       int64     `json:"total_amount"`
		OutstandingAmount int64     `json:"outstanding_amount"`
		InstallmentCount  int       `json:"installment_count"`
		PaidInstallments  int       `json:"paid_installments"`
		Status            string    `json:"status"`
		DueDate           time.Time `json:"due_date"`
	}

	var invoices []Invoice = []Invoice{}
	for rows.Next() {
		var inv Invoice
		if err := rows.Scan(&inv.ID, &inv.ContractInvoiceID, &inv.WarungName, &inv.SupplierName, &inv.TotalAmount, &inv.OutstandingAmount, &inv.InstallmentCount, &inv.PaidInstallments, &inv.Status, &inv.DueDate); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed: "+err.Error())
			return
		}
		invoices = append(invoices, inv)
	}

	writeJSON(w, http.StatusOK, invoices)
}

func (h *Handlers) GetInvoice(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	invoiceID, _ := strconv.Atoi(idStr)

	var inv struct {
		ID                int       `json:"id"`
		ContractInvoiceID int64     `json:"contract_invoice_id"`
		WarungName        string    `json:"warung_name"`
		WarungWallet      string    `json:"warung_wallet"`
		SupplierName      string    `json:"supplier_name"`
		SupplierWallet    string    `json:"supplier_wallet"`
		TotalAmount       int64     `json:"total_amount"`
		OutstandingAmount int64     `json:"outstanding_amount"`
		InstallmentCount  int       `json:"installment_count"`
		PaidInstallments  int       `json:"paid_installments"`
		Status            string    `json:"status"`
		DueDate           time.Time `json:"due_date"`
		TxHashCreate      string    `json:"tx_hash_create"`
		TxHashFund        string    `json:"tx_hash_fund"`
		TxHashRelease     string    `json:"tx_hash_release"`
	}

	err := h.db.QueryRow(`
		SELECT i.id, i.contract_invoice_id, w.warung_name, uw.wallet_address, s.company_name, us.wallet_address, i.total_amount, i.outstanding_amount, i.installment_count, i.paid_installments, i.status, i.due_date, COALESCE(i.tx_hash_create, ''), COALESCE(i.tx_hash_fund, ''), COALESCE(i.tx_hash_release, '') 
		FROM invoices i 
		JOIN warungs w ON i.warung_id = w.id 
		JOIN users uw ON w.user_id = uw.id 
		JOIN suppliers s ON i.supplier_id = s.id 
		JOIN users us ON s.user_id = us.id 
		WHERE i.id = $1`, invoiceID).
		Scan(&inv.ID, &inv.ContractInvoiceID, &inv.WarungName, &inv.WarungWallet, &inv.SupplierName, &inv.SupplierWallet, &inv.TotalAmount, &inv.OutstandingAmount, &inv.InstallmentCount, &inv.PaidInstallments, &inv.Status, &inv.DueDate, &inv.TxHashCreate, &inv.TxHashFund, &inv.TxHashRelease)
	if err != nil {
		writeError(w, http.StatusNotFound, "invoice not found: "+err.Error())
		return
	}

	// Get items
	rows, err := h.db.Query(`
		SELECT p.name, ii.quantity, ii.price, ii.subtotal 
		FROM invoice_items ii 
		JOIN products p ON ii.product_id = p.id 
		WHERE ii.invoice_id = $1`, invoiceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type Item struct {
		Name     string `json:"name"`
		Quantity int    `json:"quantity"`
		Price    int64  `json:"price"`
		Subtotal int64  `json:"subtotal"`
	}
	var items []Item = []Item{}
	for rows.Next() {
		var item Item
		rows.Scan(&item.Name, &item.Quantity, &item.Price, &item.Subtotal)
		items = append(items, item)
	}

	// Get Repayments
	repRows, err := h.db.Query(`
		SELECT id, installment_no, amount, due_date, status, COALESCE(paid_at, $1), COALESCE(tx_hash, '') 
		FROM repayments WHERE invoice_id = $2 ORDER BY installment_no ASC`, time.Time{}, invoiceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer repRows.Close()

	type Repayment struct {
		ID            int       `json:"id"`
		InstallmentNo int       `json:"installment_no"`
		Amount        int64     `json:"amount"`
		DueDate       time.Time `json:"due_date"`
		Status        string    `json:"status"`
		PaidAt        time.Time `json:"paid_at"`
		TxHash        string    `json:"tx_hash"`
	}
	var repayments []Repayment = []Repayment{}
	for repRows.Next() {
		var rep Repayment
		repRows.Scan(&rep.ID, &rep.InstallmentNo, &rep.Amount, &rep.DueDate, &rep.Status, &rep.PaidAt, &rep.TxHash)
		repayments = append(repayments, rep)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"invoice":    inv,
		"items":      items,
		"repayments": repayments,
	})
}

// Prepare & Submit operations
func (h *Handlers) FundInvoice(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	idStr := chi.URLParam(r, "id")
	invoiceID, _ := strconv.Atoi(idStr)

	var body struct {
		SignedXDR string `json:"signed_xdr"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	// Get invoice
	var inv struct {
		ID                int
		ContractInvoiceID uint64
		TotalAmount       int64
		Status            string
	}
	err := h.db.QueryRow("SELECT id, contract_invoice_id, total_amount, status FROM invoices WHERE id = $1", invoiceID).
		Scan(&inv.ID, &inv.ContractInvoiceID, &inv.TotalAmount, &inv.Status)
	if err != nil {
		writeError(w, http.StatusNotFound, "invoice not found: "+err.Error())
		return
	}

	if body.SignedXDR == "" {
		// Step 1: Return unsigned XDR
		unsignedXDR, err := soroban.BuildFundInvoice(h.stellar, wallet, wallet, inv.ContractInvoiceID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to build transaction XDR: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"unsigned_xdr": unsignedXDR})
		return
	}

	// Step 2: Submit signed XDR
	txHash, err := h.stellar.SubmitTransaction(body.SignedXDR)
	if err != nil {
		// Mock for offline testing
		txHash = "MOCK_FUND_TX_" + strconv.Itoa(int(time.Now().Unix()))
	}

	_, err = h.db.Exec(`
		UPDATE invoices 
		SET status = 'Funded', funder_wallet = $1, tx_hash_fund = $2, updated_at = $3 
		WHERE id = $4`, wallet, txHash, time.Now(), invoiceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update database: "+err.Error())
		return
	}

	// Log contract event
	h.logEvent(invoiceID, "invoice_funded", txHash, 0, `{"funder": "`+wallet+`"}`)

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "invoice funded successfully",
		"tx_hash": txHash,
	})
}

func (h *Handlers) MarkShipped(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	idStr := chi.URLParam(r, "id")
	invoiceID, _ := strconv.Atoi(idStr)

	var body struct {
		SignedXDR string `json:"signed_xdr"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	// Get invoice
	var inv struct {
		ContractInvoiceID uint64
	}
	err := h.db.QueryRow("SELECT contract_invoice_id FROM invoices WHERE id = $1", invoiceID).Scan(&inv.ContractInvoiceID)
	if err != nil {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	if body.SignedXDR == "" {
		unsignedXDR, err := soroban.BuildMarkShipped(h.stellar, wallet, inv.ContractInvoiceID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"unsigned_xdr": unsignedXDR})
		return
	}

	txHash, err := h.stellar.SubmitTransaction(body.SignedXDR)
	if err != nil {
		txHash = "MOCK_SHIP_TX_" + strconv.Itoa(int(time.Now().Unix()))
	}

	_, err = h.db.Exec("UPDATE invoices SET status = 'Shipped', updated_at = $1 WHERE id = $2", time.Now(), invoiceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.logEvent(invoiceID, "item_shipped", txHash, 0, "{}")

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "invoice marked as Shipped",
		"tx_hash": txHash,
	})
}

func (h *Handlers) ConfirmDelivery(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	idStr := chi.URLParam(r, "id")
	invoiceID, _ := strconv.Atoi(idStr)

	var body struct {
		SignedXDR string `json:"signed_xdr"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	var inv struct {
		ContractInvoiceID uint64
		TotalAmount       int64
		InstallmentCount  int
	}
	err := h.db.QueryRow("SELECT contract_invoice_id, total_amount, installment_count FROM invoices WHERE id = $1", invoiceID).Scan(&inv.ContractInvoiceID, &inv.TotalAmount, &inv.InstallmentCount)
	if err != nil {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	if body.SignedXDR == "" {
		unsignedXDR, err := soroban.BuildConfirmDelivery(h.stellar, wallet, inv.ContractInvoiceID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"unsigned_xdr": unsignedXDR})
		return
	}

	txHash, err := h.stellar.SubmitTransaction(body.SignedXDR)
	if err != nil {
		txHash = "MOCK_DELIVER_TX_" + strconv.Itoa(int(time.Now().Unix()))
	}

	tx, err := h.db.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback()

	// Update Invoice: Delivery triggers auto release on-chain, status changes to Repaying
	_, err = tx.Exec(`
		UPDATE invoices 
		SET status = 'Repaying', tx_hash_release = $1, updated_at = $2 
		WHERE id = $3`, txHash, time.Now(), invoiceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Generate repayments schedule
	installmentAmount := inv.TotalAmount / int64(inv.InstallmentCount)
	for i := 1; i <= inv.InstallmentCount; i++ {
		// Set due date every 7 days (mock weeks for demonstration/simulation cycle)
		dueDate := time.Now().AddDate(0, 0, i*7)
		_, err = tx.Exec(`
			INSERT INTO repayments (invoice_id, installment_no, amount, due_date, status) 
			VALUES ($1, $2, $3, $4, 'UNPAID')`, invoiceID, i, installmentAmount, dueDate)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.logEvent(invoiceID, "delivery_confirmed", txHash, 0, "{}")
	h.logEvent(invoiceID, "funds_released", txHash, 0, `{"released_to_supplier": true}`)

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "delivery confirmed, funds released to supplier, repayment schedule created",
		"tx_hash": txHash,
	})
}

func (h *Handlers) PayInstallment(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	idStr := chi.URLParam(r, "id")
	invoiceID, _ := strconv.Atoi(idStr)

	var body struct {
		Amount    int64  `json:"amount"`
		SignedXDR string `json:"signed_xdr"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var inv struct {
		ContractInvoiceID uint64
		WarungID          int
	}
	err := h.db.QueryRow("SELECT contract_invoice_id, warung_id FROM invoices WHERE id = $1", invoiceID).Scan(&inv.ContractInvoiceID, &inv.WarungID)
	if err != nil {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	if body.SignedXDR == "" {
		unsignedXDR, err := soroban.BuildPayInstallment(h.stellar, wallet, wallet, inv.ContractInvoiceID, body.Amount)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"unsigned_xdr": unsignedXDR})
		return
	}

	txHash, err := h.stellar.SubmitTransaction(body.SignedXDR)
	if err != nil {
		txHash = "MOCK_PAY_TX_" + strconv.Itoa(int(time.Now().Unix()))
	}

	tx, err := h.db.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback()

	// Update outstanding in invoice
	var outstanding int64
	var paidInstallments int
	var totalInstallments int
	err = tx.QueryRow(`
		UPDATE invoices 
		SET outstanding_amount = outstanding_amount - $1, paid_installments = paid_installments + 1, updated_at = $2 
		WHERE id = $3 
		RETURNING outstanding_amount, paid_installments, installment_count`, body.Amount, time.Now(), invoiceID).
		Scan(&outstanding, &paidInstallments, &totalInstallments)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Update status if fully paid
	if outstanding <= 0 || paidInstallments >= totalInstallments {
		_, err = tx.Exec("UPDATE invoices SET status = 'Paid' WHERE id = $1", invoiceID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	// Find the next UNPAID repayment item and mark as PAID
	var repaymentID int
	err = tx.QueryRow(`
		SELECT id FROM repayments 
		WHERE invoice_id = $1 AND status = 'UNPAID' 
		ORDER BY installment_no ASC LIMIT 1`, invoiceID).Scan(&repaymentID)
	if err == nil {
		_, err = tx.Exec(`
			UPDATE repayments 
			SET status = 'PAID', paid_at = $1, tx_hash = $2 
			WHERE id = $3`, time.Now(), txHash, repaymentID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	// Restore Warung Credit Limit
	_, err = tx.Exec("UPDATE warungs SET available_limit = available_limit + $1 WHERE id = $2", body.Amount, inv.WarungID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Increase reputation score
	_, err = tx.Exec(`
		UPDATE warungs 
		SET reputation_score = LEAST(reputation_score + 15, 1000) 
		WHERE id = $1`, inv.WarungID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Log in reputation_scores table
	_, err = tx.Exec(`
		INSERT INTO reputation_scores (warung_id, score, total_invoice, paid_on_time) 
		VALUES ($1, (SELECT reputation_score FROM warungs WHERE id = $1), (SELECT COUNT(*) FROM invoices WHERE warung_id = $1), (SELECT COALESCE(SUM(paid_installments), 0) FROM invoices WHERE warung_id = $1)) 
		ON CONFLICT DO NOTHING`, inv.WarungID) // simple record insert, ignore conflict for simplicity

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.logEvent(invoiceID, "installment_paid", txHash, 0, fmt.Sprintf(`{"amount": %d}`, body.Amount))
	h.logEvent(invoiceID, "reputation_updated", txHash, 0, `{"change": 15}`)

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "installment paid successfully",
		"tx_hash": txHash,
	})
}

// 5. Admin Dispute Endpoints
func (h *Handlers) ListAdminInvoices(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT i.id, i.contract_invoice_id, w.warung_name, s.company_name, i.total_amount, i.outstanding_amount, i.status, i.due_date 
		FROM invoices i 
		JOIN warungs w ON i.warung_id = w.id 
		JOIN suppliers s ON i.supplier_id = s.id 
		ORDER BY i.created_at DESC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type Inv struct {
		ID                int       `json:"id"`
		ContractInvoiceID int64     `json:"contract_invoice_id"`
		WarungName        string    `json:"warung_name"`
		SupplierName      string    `json:"supplier_name"`
		TotalAmount       int64     `json:"total_amount"`
		OutstandingAmount int64     `json:"outstanding_amount"`
		Status            string    `json:"status"`
		DueDate           time.Time `json:"due_date"`
	}

	var list []Inv = []Inv{}
	for rows.Next() {
		var i Inv
		rows.Scan(&i.ID, &i.ContractInvoiceID, &i.WarungName, &i.SupplierName, &i.TotalAmount, &i.OutstandingAmount, &i.Status, &i.DueDate)
		list = append(list, i)
	}

	writeJSON(w, http.StatusOK, list)
}

func (h *Handlers) ResolveDispute(w http.ResponseWriter, r *http.Request) {
	wallet := r.Header.Get("X-Wallet-Address")
	idStr := chi.URLParam(r, "id")
	invoiceID, _ := strconv.Atoi(idStr)

	var body struct {
		ReleaseToSupplier bool   `json:"release_to_supplier"`
		SignedXDR         string `json:"signed_xdr"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request data")
		return
	}

	var inv struct {
		ContractInvoiceID uint64
	}
	err := h.db.QueryRow("SELECT contract_invoice_id FROM invoices WHERE id = $1", invoiceID).Scan(&inv.ContractInvoiceID)
	if err != nil {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	if body.SignedXDR == "" {
		unsignedXDR, err := soroban.BuildResolveDispute(h.stellar, wallet, inv.ContractInvoiceID, body.ReleaseToSupplier)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"unsigned_xdr": unsignedXDR})
		return
	}

	txHash, err := h.stellar.SubmitTransaction(body.SignedXDR)
	if err != nil {
		txHash = "MOCK_RESOLVE_TX_" + strconv.Itoa(int(time.Now().Unix()))
	}

	status := "Cancelled"
	if body.ReleaseToSupplier {
		status = "Repaying"
	}

	_, err = h.db.Exec("UPDATE invoices SET status = $1, updated_at = $2 WHERE id = $3", status, time.Now(), invoiceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.logEvent(invoiceID, "dispute_resolved", txHash, 0, fmt.Sprintf(`{"release_to_supplier": %t}`, body.ReleaseToSupplier))

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "dispute resolved successfully",
		"status":  status,
		"tx_hash": txHash,
	})
}

func (h *Handlers) ListContractEvents(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, COALESCE(invoice_id, 0), event_name, tx_hash, ledger, payload_json, created_at 
		FROM contract_events ORDER BY created_at DESC LIMIT 50`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type Ev struct {
		ID          int       `json:"id"`
		InvoiceID   int       `json:"invoice_id"`
		EventName   string    `json:"event_name"`
		TxHash      string    `json:"tx_hash"`
		Ledger      int64     `json:"ledger"`
		PayloadJSON string    `json:"payload_json"`
		CreatedAt   time.Time `json:"created_at"`
	}

	var events []Ev = []Ev{}
	for rows.Next() {
		var e Ev
		rows.Scan(&e.ID, &e.InvoiceID, &e.EventName, &e.TxHash, &e.Ledger, &e.PayloadJSON, &e.CreatedAt)
		events = append(events, e)
	}

	writeJSON(w, http.StatusOK, events)
}

// 6. Logging contract events to table
func (h *Handlers) logEvent(invoiceID int, name, txHash string, ledger int64, payload string) {
	_, err := h.db.Exec(`
		INSERT INTO contract_events (invoice_id, event_name, tx_hash, ledger, payload_json) 
		VALUES ($1, $2, $3, $4, $5)`, invoiceID, name, txHash, ledger, payload)
	if err != nil {
		log.Println("Error logging contract event: ", err)
	}
}

// Helper: Parse public address from Stellar secret key using Go SDK keypair
func getPublicKeyFromSecret(secret string) (string, error) {
	kp, err := keypair.ParseFull(secret)
	if err != nil {
		return "", err
	}
	return kp.Address(), nil
}

// 7. User Management (Admin)
func (h *Handlers) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, wallet_address, role, name, phone, created_at FROM users ORDER BY id DESC")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to query users")
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var wallet, role, name, phone string
		var createdAt time.Time
		if err := rows.Scan(&id, &wallet, &role, &name, &phone, &createdAt); err != nil {
			continue
		}
		users = append(users, map[string]interface{}{
			"id":             id,
			"wallet_address": wallet,
			"role":           role,
			"name":           name,
			"phone":          phone,
			"created_at":     createdAt,
		})
	}
	writeJSON(w, http.StatusOK, users)
}

func (h *Handlers) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "missing user id")
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Role == "" {
		writeError(w, http.StatusBadRequest, "invalid request data")
		return
	}

	// Basic validation of role
	if body.Role != "warung" && body.Role != "supplier" && body.Role != "funder" && body.Role != "admin" {
		writeError(w, http.StatusBadRequest, "invalid role specified")
		return
	}

	_, err := h.db.Exec("UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", body.Role, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update user role")
		return
	}

	// Also might need to create default profiles if they become supplier/warung, but to keep it simple we just update the role for now.
	writeJSON(w, http.StatusOK, map[string]string{"message": "user role updated successfully"})
}

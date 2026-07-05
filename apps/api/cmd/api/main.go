package main

import (
	"database/sql"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"lumbung-desa-digital/apps/api/internal/config"
	"lumbung-desa-digital/apps/api/internal/db"
	httpInternal "lumbung-desa-digital/apps/api/internal/http"
	"lumbung-desa-digital/apps/api/internal/stellar"
)

func main() {
	log.Println("Starting Warung Supplier Credit API...")

	// Load Config
	cfg := config.Load()

	// Connect to Database
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Database connection error: %v", err)
	}
	defer database.Close()

	// Run Schema Migrations
	migrationPath := filepath.Join("migrations", "000001_init_schema.up.sql")
	err = db.RunMigrations(database, migrationPath)
	if err != nil {
		log.Printf("Warning: Migrations execution: %v (retrying with alternate path...)", err)
		// Run migrations will handle alternate paths inside, but print anyway
	}

	// Seed Demo Data if empty
	seedDemoData(database)

	// Initialize Stellar Client
	stellarClient := stellar.New(cfg.HorizonURL, cfg.NetworkPassphrase, cfg.ContractID)

	// Initialize Handlers & Router
	h := httpInternal.NewHandlers(database, cfg, stellarClient)
	router := httpInternal.NewRouter(h)

	// Start Server
	serverAddr := ":" + cfg.Port
	log.Printf("API Server is running on port %s", cfg.Port)
	if err := http.ListenAndServe(serverAddr, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func seedDemoData(database *sql.DB) {
	var count int
	err := database.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Printf("Failed to count users for seeding: %v", err)
		return
	}

	if count > 0 {
		log.Println("Database already contains data, skipping seeding.")
		return
	}

	log.Println("Seeding demo database tables...")

	// 1. Insert Users
	// Seed mock wallets initially. In execution, they can link their real freighter wallet using /api/auth/link-demo-wallet
	var warungUserID, supplierUserID, funderUserID int

	err = database.QueryRow(`
		INSERT INTO users (wallet_address, role, name, phone) 
		VALUES ('GBWARUNGSEED000000000000000000000000000000000000001', 'warung', 'Bu Sari', '08123456789') 
		RETURNING id`).Scan(&warungUserID)
	if err != nil {
		log.Fatalf("failed seeding user 1: %v", err)
	}

	err = database.QueryRow(`
		INSERT INTO users (wallet_address, role, name, phone) 
		VALUES ('GBSUPPLIERSEED0000000000000000000000000000000000001', 'supplier', 'Aneka Makmur Jaya', '08987654321') 
		RETURNING id`).Scan(&supplierUserID)
	if err != nil {
		log.Fatalf("failed seeding user 2: %v", err)
	}

	err = database.QueryRow(`
		INSERT INTO users (wallet_address, role, name, phone) 
		VALUES ('GBFUNDERSEED0000000000000000000000000000000000000001', 'funder', 'Koperasi Mitra Sejahtera', '08111222333') 
		RETURNING id`).Scan(&funderUserID)
	if err != nil {
		log.Fatalf("failed seeding user 3: %v", err)
	}

	// 2. Insert Warung Profile
	var warungID int
	err = database.QueryRow(`
		INSERT INTO warungs (user_id, warung_name, owner_name, city, credit_limit, available_limit, reputation_score, status) 
		VALUES ($1, 'Warung Sari Jaya', 'Bu Sari', 'Bandung', 25000000, 20750000, 720, 'active') RETURNING id`, warungUserID).Scan(&warungID)
	if err != nil {
		log.Fatalf("failed seeding warung: %v", err)
	}

	// 3. Insert Supplier Profile
	var supplierID int
	err = database.QueryRow(`
		INSERT INTO suppliers (user_id, company_name, city, status) 
		VALUES ($1, 'Aneka Makmur Jaya', 'Bandung', 'active') RETURNING id`, supplierUserID).Scan(&supplierID)
	if err != nil {
		log.Fatalf("failed seeding supplier: %v", err)
	}

	// 4. Insert Products
	products := []struct {
		Name     string
		Category string
		Unit     string
		Price    int64
		MinOrder int
		Stock    int
		ImageURL string
	}{
		{"Beras Rojo Lele Premium 10kg", "Sembako", "karung", 150000, 2, 100, "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400"},
		{"Minyak Goreng Bimoli 2L", "Minyak", "botol", 35000, 5, 150, "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400"},
		{"Indomie Mi Goreng 85g 1 Dus", "Mie Instan", "dus", 120000, 1, 80, "https://images.unsplash.com/photo-1612966608967-3cec33142e4f?q=80&w=400"},
		{"Telur Ayam Negeri 1 Rak", "Telur", "rak", 60000, 1, 50, "https://images.unsplash.com/photo-1516448424440-9dbca97779c1?q=80&w=400"},
		{"Gula Pasir Gulaku 5kg", "Gula", "pak", 75000, 2, 90, "https://images.unsplash.com/photo-1596450541743-74a6888513b3?q=80&w=400"},
	}

	var seededProductIDs []int
	for _, p := range products {
		var pid int
		err = database.QueryRow(`
			INSERT INTO products (supplier_id, name, category, unit, price, min_order, stock, image_url) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`, supplierID, p.Name, p.Category, p.Unit, p.Price, p.MinOrder, p.Stock, p.ImageURL).Scan(&pid)
		if err != nil {
			log.Fatalf("failed seeding product: %v", err)
		}
		seededProductIDs = append(seededProductIDs, pid)
	}

	// 5. Seed Reputation Scores Initial History
	_, err = database.Exec(`
		INSERT INTO reputation_scores (warung_id, score, total_invoice, paid_on_time, late_payment, default_count) 
		VALUES ($1, 720, 1, 2, 0, 0)`, warungID)
	if err != nil {
		log.Fatalf("failed seeding reputation: %v", err)
	}

	// 6. Seed Sample Active Invoice
	// INV-2025-0501, total Rp4.250.000, 5 installments, 2 paid, 3 outstanding
	var creditRequestID int
	err = database.QueryRow(`
		INSERT INTO credit_requests (warung_id, supplier_id, total_amount, status, requested_at, approved_at) 
		VALUES ($1, $2, 4250000, 'APPROVED', $3, $4) RETURNING id`, warungID, supplierID, time.Now().AddDate(0, 0, -30), time.Now().AddDate(0, 0, -29)).Scan(&creditRequestID)
	if err != nil {
		log.Fatalf("failed seeding credit request: %v", err)
	}

	// Insert credit request items
	_, _ = database.Exec(`
		INSERT INTO credit_request_items (credit_request_id, product_id, quantity, price, subtotal) 
		VALUES ($1, $2, 20, 150000, 3000000)`, creditRequestID, seededProductIDs[0]) // Beras Rojo Lele
	_, _ = database.Exec(`
		INSERT INTO credit_request_items (credit_request_id, product_id, quantity, price, subtotal) 
		VALUES ($1, $2, 10, 120000, 1200000)`, creditRequestID, seededProductIDs[2]) // Indomie
	_, _ = database.Exec(`
		INSERT INTO credit_request_items (credit_request_id, product_id, quantity, price, subtotal) 
		VALUES ($1, $2, 1, 50000, 50000)`, creditRequestID, seededProductIDs[1]) // Oil

	var invoiceID int
	err = database.QueryRow(`
		INSERT INTO invoices (contract_invoice_id, credit_request_id, warung_id, supplier_id, funder_wallet, asset_contract, total_amount, outstanding_amount, installment_count, paid_installments, status, due_date, tx_hash_create, tx_hash_fund, tx_hash_release, created_at, updated_at) 
		VALUES (1, $1, $2, $3, 'GBFUNDERSEED0000000000000000000000000000000000000001', 'CASSETTEST00000000000000000000000000000000000000000', 4250000, 2550000, 5, 2, 'Repaying', $4, 'TX_HASH_CREATE_SAMPLE', 'TX_HASH_FUND_SAMPLE', 'TX_HASH_RELEASE_SAMPLE', $5, $5) 
		RETURNING id`, creditRequestID, warungID, supplierID, time.Now().AddDate(0, 0, 15), time.Now().AddDate(0, 0, -25)).Scan(&invoiceID)
	if err != nil {
		log.Fatalf("failed seeding invoice: %v", err)
	}

	// Insert invoice items
	_, _ = database.Exec(`INSERT INTO invoice_items (invoice_id, product_id, quantity, price, subtotal) VALUES ($1, $2, 20, 150000, 3000000)`, invoiceID, seededProductIDs[0])
	_, _ = database.Exec(`INSERT INTO invoice_items (invoice_id, product_id, quantity, price, subtotal) VALUES ($1, $2, 10, 120000, 1200000)`, invoiceID, seededProductIDs[2])
	_, _ = database.Exec(`INSERT INTO invoice_items (invoice_id, product_id, quantity, price, subtotal) VALUES ($1, $2, 1, 50000, 50000)`, invoiceID, seededProductIDs[1])

	// Repayments: 5 installments of 850,000 each. 2 paid, 3 unpaid.
	for i := 1; i <= 5; i++ {
		var status string = "UNPAID"
		var paidAt interface{} = nil
		var txHash interface{} = nil
		dueDate := time.Now().AddDate(0, 0, (i-3)*7) // installment 1 & 2 are overdue/paid, 3 is near due

		if i <= 2 {
			status = "PAID"
			paidAt = time.Now().AddDate(0, 0, (i-4)*7)
			txHash = "TX_HASH_REPAY_SAMPLE_" + strconv.Itoa(i)
		}

		_, err = database.Exec(`
			INSERT INTO repayments (invoice_id, installment_no, amount, due_date, paid_at, status, tx_hash) 
			VALUES ($1, $2, $3, $4, $5, $6, $7)`, invoiceID, i, 850000, dueDate, paidAt, status, txHash)
		if err != nil {
			log.Fatalf("failed seeding repayment %d: %v", i, err)
		}
	}

	log.Println("Database seeded with demo profiles, products, and active invoice INV-2025-0501.")
}

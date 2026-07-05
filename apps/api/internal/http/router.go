package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
)

func NewRouter(h *Handlers) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Wallet-Address"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	r.Use(c.Handler)

	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/connect-wallet", h.ConnectWallet)
		r.Post("/auth/link-demo-wallet", h.LinkDemoWallet)
		r.Get("/me", h.GetMe)

		// Warung routes
		r.Get("/warung/dashboard", h.GetWarungDashboard)
		r.Get("/products", h.ListProducts)
		r.Post("/credit-requests", h.CreateCreditRequest)
		r.Get("/invoices", h.ListInvoices)
		r.Get("/invoices/{id}", h.GetInvoice)
		r.Post("/invoices/{id}/confirm-delivery", h.ConfirmDelivery)
		r.Post("/invoices/{id}/pay-installment", h.PayInstallment)

		// Supplier routes
		r.Get("/supplier/dashboard", h.GetSupplierDashboard)
		r.Get("/supplier/requests", h.ListSupplierRequests)
		r.Post("/supplier/requests/{id}/approve", h.ApproveRequest)
		r.Post("/supplier/requests/{id}/reject", h.RejectRequest)
		r.Post("/supplier/invoices/{id}/mark-shipped", h.MarkShipped)

		// Admin/Funder routes
		r.Get("/admin/invoices", h.ListAdminInvoices)
		r.Post("/admin/invoices/{id}/fund", h.FundInvoice)
		r.Post("/admin/disputes/{id}/resolve", h.ResolveDispute)
		r.Get("/admin/contract-events", h.ListContractEvents)
		r.Get("/admin/users", h.ListUsers)
		r.Put("/admin/users/{id}/role", h.UpdateUserRole)
	})

	return r
}

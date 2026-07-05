ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: build run-backend run-frontend test-contract simulate bindings help

help:
	@echo "Lumbung Desa Digital - Warung Supplier Credit Makefile"
	@echo "======================================================="
	@echo "Available commands:"
	@echo "  make build         - Build smart contract and compile Go API"
	@echo "  make run-backend   - Run the Go REST API server"
	@echo "  make run-frontend  - Run the React Vite frontend development server"
	@echo "  make test-contract - Run unit tests for Soroban Rust contract"
	@echo "  make simulate      - Run the PowerShell automation simulation script"
	@echo "  make bindings      - Generate TS contract bindings from Wasm"

build:
	powershell -ExecutionPolicy Bypass -File ./scripts/build-contract.ps1
	cd apps/api && go build -o ../../api-server cmd/api/main.go

run-backend:
	cd apps/api && go run cmd/api/main.go

run-frontend:
	cd apps/web && npm run dev

test-contract:
	cd contracts/warung_supplier_credit && cargo test

simulate:
	powershell -ExecutionPolicy Bypass -File ./scripts/simulate-flow.ps1

bindings:
	stellar contract bindings typescript --output-dir packages/contract-bindings --network testnet --contract-id $(CONTRACT_ID) --overwrite

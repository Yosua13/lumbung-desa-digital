package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/lib/pq"
)

func Connect(dbURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open db: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping db: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL")
	return db, nil
}

func RunMigrations(db *sql.DB, migrationFile string) error {
	content, err := os.ReadFile(migrationFile)
	if err != nil {
		// Try relative paths if absolute failed
		altPath := filepath.Join("migrations", "000001_init_schema.up.sql")
		content, err = os.ReadFile(altPath)
		if err != nil {
			altPath2 := filepath.Join("apps", "api", "migrations", "000001_init_schema.up.sql")
			content, err = os.ReadFile(altPath2)
			if err != nil {
				return fmt.Errorf("failed to read migration file: %w", err)
			}
		}
	}

	_, err = db.Exec(string(content))
	if err != nil {
		return fmt.Errorf("failed to execute migrations: %w", err)
	}

	log.Println("Database schema migrations executed successfully")
	return nil
}

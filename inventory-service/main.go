package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

type Stock struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

var db *sql.DB

func main() {
	var err error

	db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal("Database connection failed: ", err)
	}

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/stock/", stockHandler)
	http.HandleFunc("/stock/reserve", reserveHandler)

	log.Println("Inventory service running on port 8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func stockHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var productID int
	_, err := fmt.Sscanf(r.URL.Path, "/stock/%d", &productID)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var stock Stock
	err = db.QueryRow(
		"SELECT product_id, quantity FROM stock WHERE product_id = $1",
		productID,
	).Scan(&stock.ProductID, &stock.Quantity)

	if err == sql.ErrNoRows {
		http.Error(w, "Stock not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stock)
}

func reserveHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request Stock
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if request.Quantity <= 0 {
		http.Error(w, "Quantity must be positive", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		"UPDATE stock SET quantity = quantity - $1 WHERE product_id = $2 AND quantity >= $1",
		request.Quantity,
		request.ProductID,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Insufficient stock or product not found", http.StatusConflict)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Stock reserved successfully"})
}

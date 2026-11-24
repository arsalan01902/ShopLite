
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;

// Allow the API to receive JSON data
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "shopdb",
  user: process.env.DB_USER || "shoplite_user",
  password: process.env.DB_PASSWORD,
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Get all products
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, price FROM products ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get one product by ID
app.get("/products/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, price FROM products WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Catalog service running on port ${PORT}`);
});


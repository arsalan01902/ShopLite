CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price) VALUES
('Keyboard', 4500),
('Mouse', 1800),
('Monitor', 32000);

INSERT INTO stock (product_id, quantity) VALUES
(1, 20),
(2, 30),
(3, 10);

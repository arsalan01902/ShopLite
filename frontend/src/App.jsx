
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const response = await fetch("/api/catalog/products");
      if (!response.ok) throw new Error("Could not load products");

      const data = await response.json();
      setProducts(data);

      const stockData = {};
      await Promise.all(
        data.map(async (product) => {
          const result = await fetch(
            `/api/inventory/stock/${product.id}`
          );
          if (result.ok) {
            stockData[product.id] = await result.json();
          }
        })
      );

      setStock(stockData);

      const orderResponse = await fetch("/api/orders/orders");
      if (orderResponse.ok) {
        setOrders(await orderResponse.json());
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function placeOrder(productId) {
    try {
      setMessage("");

      const response = await fetch("/api/orders/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Order failed");
      }

      setMessage("Order placed successfully!");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <h2 className="loading">Loading ShopLite...</h2>;
  }

  return (
    <div className="app">
      <header>
        <h1>ShopLite</h1>
        <p>Your simple online shopping store</p>
      </header>

      <main>
        <h2>Our Products</h2>

        {message && <p className="message">{message}</p>}

        <div className="products">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <h3>{product.name}</h3>
              <p className="price">
                Rs. {Number(product.price).toLocaleString()}
              </p>
              <p>
                Available stock:{" "}
                {stock[product.id]?.quantity ?? "Loading"}
              </p>
              <button
                onClick={() => placeOrder(product.id)}
                disabled={!stock[product.id]?.quantity}
              >
                Place Order
              </button>
            </article>
          ))}
        </div>

        <section className="orders">
          <h2>Recent Orders</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            orders.map((order) => (
              <p key={order.id}>
                Order #{order.id} — Product {order.productId} —
                Quantity: {order.quantity} — Rs.{" "}
                {Number(order.totalPrice).toLocaleString()} — {order.status}
              </p>
            ))
          )}
        </section>
      </main>

      <footer>ShopLite | DevOps Bootcamp Project</footer>
    </div>
  );
}

export default App;


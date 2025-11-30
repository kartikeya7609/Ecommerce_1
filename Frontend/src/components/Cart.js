import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Cart.css";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence, vh } from "framer-motion";



const Cart = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
 const handleCheckout = () => {
    navigate("/checkout");
  };

  const API_CONFIG = {
    BASE_URL: "https://ecommerce-1-zz8i.onrender.com",
    CART: "/api/cart",
    AUTH: "/api/auth",
    PRODUCTS: "/api/products",
  };

  useEffect(() => {
    if (isAuthenticated && user && token) {
      fetchCartItems(user.email, token);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, token]);

  const fetchCartItems = async (email, token) => {
    try {
      setLoading(true);
      console.log("Fetching cart items with token:", token ? "Token exists" : "No token");
      const res = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.CART}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status < 500,
          timeout: 10000,
        }
      );

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (res.status === 404) {
        setCartItems([]);
        toast.info("Your cart is empty");
        return;
      }

      let cartData = [];
      if (Array.isArray(res.data)) {
        cartData = res.data;
      } else if (res.data?.items) {
        cartData = res.data.items;
      }

      if (cartData.length === 0) {
        setCartItems([]);
        toast.info("Your cart is empty");
        return;
      }

      // Map cart items to the format expected by the component
      const formattedItems = cartData.map(item => ({
        product_id: item.id,
        name: item.title || "Unknown Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || "/logo192.png"
      }));
      
      console.log("Formatted cart items:", formattedItems);
      setCartItems(formattedItems);
    } catch (err) {
      console.error("Error fetching cart:", err);
      if (err.response?.status === 401) {
        handleUnauthorized();
      } else {
        toast.error("Failed to load cart. Please try again.");
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnauthorized = () => {
    toast.error("Session expired. Please login again.");
    navigate("/login");
  };

  // Optimistic quantity update with rollback
const updateQuantity = async (productId, delta) => {
  if (!isAuthenticated) {
    toast.error("Please login to update your cart");
    navigate("/login");
    return;
  }

  const itemIndex = cartItems.findIndex((i) => i.product_id === productId);
  if (itemIndex === -1) {
    toast.error("Item not found in cart");
    return;
  }

  const item = cartItems[itemIndex];
  const newQuantity = Math.max(1, item.quantity + delta);
  if (newQuantity === item.quantity) return;

  // Optimistic UI update
  const prevCart = [...cartItems];
  const nextCart = prevCart.map((it) =>
    it.product_id === productId ? { ...it, quantity: newQuantity } : it
  );
  setCartItems(nextCart);
  setLoading(true);

  try {
    const response = await axios.put(
      `${API_CONFIG.BASE_URL}${API_CONFIG.CART}/${productId}`,
      { quantity: newQuantity },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 7000 }
    );

    // If backend returns updated items, sync them
    const serverItems =
      Array.isArray(response.data)
        ? response.data
        : response.data?.items ?? null;

    if (serverItems) {
      // Map server items into frontend format if needed
      const formatted = serverItems.map((it) => ({
        product_id: it.id ?? it.product_id,
        name: it.title ?? it.name,
        price: parseFloat(it.price) || 0,
        quantity: it.quantity || 1,
        image: it.image || "/logo192.png",
      }));
      setCartItems(formatted);
    } else {
      toast.success("Quantity updated");
    }
  } catch (err) {
    console.error("Failed to update quantity:", err);
    // rollback
    setCartItems(prevCart);
    if (err.response?.status === 401) {
      handleUnauthorized();
    } else {
      toast.error(err.response?.data?.error || "Failed to update quantity.");
    }
  } finally {
    setLoading(false);
  }
};

// Optimistic remove with server call (DELETE /api/cart/:productId)
const removeItem = async (productId) => {
  if (!isAuthenticated) {
    toast.error("Please login to modify your cart");
    navigate("/login");
    return;
  }

  // Optimistic UI: remove item immediately, but keep a backup
  const prevCart = [...cartItems];
  const nextCart = prevCart.filter((item) => item.product_id !== productId);
  setCartItems(nextCart);
  setLoading(true);

  try {
    const response = await axios.delete(
      `${API_CONFIG.BASE_URL}${API_CONFIG.CART}/${productId}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 7000 }
    );

    // If server returned updated cart, sync
    const serverItems =
      Array.isArray(response.data)
        ? response.data
        : response.data?.items ?? null;

    if (serverItems) {
      const formatted = serverItems.map((it) => ({
        product_id: it.id ?? it.product_id,
        name: it.title ?? it.name,
        price: parseFloat(it.price) || 0,
        quantity: it.quantity || 1,
        image: it.image || "/logo192.png",
      }));
      setCartItems(formatted);
    } else {
      toast.success("Item removed successfully");
    }
  } catch (err) {
    console.error("Failed to remove item:", err);
    // rollback if failed
    setCartItems(prevCart);
    if (err.response?.status === 401) {
      handleUnauthorized();
    } else {
      toast.error(err.response?.data?.error || "Failed to remove item.");
    }
  } finally {
    setLoading(false);
  }
};

const clearCart = async () => {
  if (!isAuthenticated) {
    toast.error("Please login to modify your cart");
    navigate("/login");
    return;
  }

  if (!window.confirm("Are you sure you want to clear your cart?")) return;

  try {
    setLoading(true);
    console.log("Requesting server to clear cart");

    // Call the new bulk-clear endpoint
    const resp = await axios.delete(
      `${API_CONFIG.BASE_URL}${API_CONFIG.CART}`, // ensure API_CONFIG.CART is '/api/cart' or update accordingly
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );

    if (resp.status === 200) {
      // server returns { items: [] } — use that to update UI
      const serverItems = resp.data?.items ?? [];
      setCartItems(serverItems);
      toast.success("Cart cleared");
    } else {
      toast.error("Failed to clear cart.");
      // optional: fetchCart() to sync
      if (typeof fetchCart === "function") await fetchCartItems();
    }
  } catch (err) {
    console.error("Failed to clear cart:", err);
    if (err.response?.status === 401) {
      handleUnauthorized();
    } else {
      toast.error(err.response?.data?.error || "Failed to clear cart.");
      if (typeof fetchCart === "function") await fetchCartItems();
    }
  } finally {
    setLoading(false);
  }
};

  const getTotal = () => {
    return cartItems
      .reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + price * quantity;
      }, 0)
      .toFixed(2);
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="cart-loading">
        <div className="loading-spinner"></div>
        <p>Verifying your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="cart-empty" style={{height:"100vh"}}>
        <h2>Please login to view your cart 🔐</h2>
        {process.env.NODE_ENV === "development" && (
          <div className="debug-info">
            <p>Debug Information:</p>
            <p>Token: {token ? "Exists" : "Missing"}</p>
            <p>Email: {user?.email || "Not available"}</p>
          </div>
        )}
        <button
          className="btn-continue-shopping"
          onClick={() => navigate("/login")}
        >
          Login Now
        </button>
      </div>
    );
  }

  if (!loading && cartItems.length === 0) {
    return (
      <div className="cp-root" role="region" aria-label="Shopping cart" style={{height:"100vh"}} >
      <div className="cart-empty" >
        <h2>Your cart is empty 🛒</h2>
        <button
          className="btn-continue-shopping"
          onClick={() => navigate("/products")}
        >
          Continue Shopping
        </button>
      </div>
      </div>
    );
  }

    return (
    <div style={styles.page} className="cp-root" role="region" aria-label="Shopping cart">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />

      <div className="cp-hero">
        <div>
          <h1 style={styles.heading}>🛒 Your Cart</h1>
          <p className="cp-sub">Review items — secure checkout with fast delivery options.</p>
        </div>
        <div className="cp-actions">
          <button className="btn glass" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(cartItems)); toast.success('Cart copied'); }}>Share</button>
          <button className="btn primary" onClick={() => toast.info('Save for later — demo')}>Save</button>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="cp-empty" style={styles.empty}>
          <svg width="84" height="84" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M5 6l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" stroke="#9fbadf" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 10v6M15 10v6" stroke="#9fbadf" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3>Your cart is empty!</h3>
          <p className="muted">Add products to your cart. We saved some great picks for you.</p>
          <div style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={() => toast.info('Navigate to store (demo)')}>Start shopping</button>
          </div>
        </div>
      ) : (
        <div className="cp-grid">
          <main className="cp-list">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.article
                  key={item.product_id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  className="cp-card"
                >
                  <img src={item.image} alt={item.name} className="cp-img" onError={(e)=>e.target.src='/logo192.png'} />

                  <div className="cp-meta">
                    <div className="cp-top">
                      <div>
                        <h4 className="cp-title">{item.name}</h4>
                        <p className="muted small">{item.brand || 'Top rated'}</p>
                      </div>

                      <div className="cp-price">
                        <div className="big">${(item.price * item.quantity).toFixed(2)}</div>
                        <div className="muted small">{item.quantity} × ${(item.price).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="cp-controls">
                      <div className="qty">
                        <button aria-label="decrease" onClick={() => updateQuantity(item.product_id, -1)} disabled={item.quantity <= 1 || loading}>−</button>
                        <div className="num" aria-live="polite">{item.quantity}</div>
                        <button aria-label="increase" onClick={() => updateQuantity(item.product_id, 1)} disabled={loading}>+</button>
                      </div>

                      <div className="row-actions">
                        <button className="link" onClick={() => removeItem(item.product_id)} disabled={loading}>🗑 Remove</button>
                        <button className="link" onClick={() => toast.info('Saved to wishlist (demo)')}>♡ Save</button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>

            <div className="cp-footer" style={styles.totalContainer}>
              <div className="cp-footer-inner">
                <div>
                  <div className="muted small">Total items: <strong>{cartItems.reduce((s,i)=>s+i.quantity,0)}</strong></div>
                  <div style={styles.total}>Total: ${getTotal()}</div>
                </div>

                <div className="cp-footer-actions">
                  <button className="btn ghost" onClick={clearCart} disabled={loading || cartItems.length === 0}>🧹 Clear Cart</button>
                  <button className="btn primary" onClick={handleCheckout} disabled={loading || cartItems.length === 0}>💳 Checkout</button>
                </div>
              </div>
            </div>
          </main>

          <aside className="cp-aside">
            <div className="cp-summary">
              <h5>Order Summary</h5>
              <div className="muted small">Subtotal <span>${getTotal()}</span></div>
              <div className="muted small">Shipping <span>Free</span></div>
              <hr />
              <div className="total-line"><strong>Total</strong> <strong>${getTotal()}</strong></div>
              <button className="btn primary" style={{ width: '100%', marginTop: 12 }} onClick={handleCheckout} disabled={loading || cartItems.length === 0}>Proceed to Checkout</button>

              <div className="help muted small" style={{ marginTop: 12 }}>Need help? <a href="#" onClick={(e)=>{e.preventDefault(); toast.info('Contact support at support@example.com')}}>Contact support</a></div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// --- styles object kept (variable name preserved) ---
const styles = {
  page: {
    background: "linear-gradient(135deg, #0f1724 0%, #1e3c72 60%)",
    backgroundColor: "#0b0f14",
    color: "#eaf6ff",
    minHeight: "100vh",
    padding: "2rem",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    transition: "all 0.25s ease",
  },
  heading: {
    fontSize: "2.2rem",
    color: "#e7fbff",
    margin: 0,
    textShadow: "0 6px 18px rgba(0,0,0,0.6)",
  },
  empty: {
    textAlign: "center",
    color: "#bfcbd6",
    marginTop: 36,
    padding: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    transition: "transform 0.2s",
    boxShadow: "0 6px 24px rgba(2,6,23,0.6)",
  },
  image: {
    width: "100%",
    height: "160px",
    objectFit: "contain",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "0.5rem",
    borderRadius: 8,
  },
  info: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    flex: 1,
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: "700",
    marginBottom: "0.25rem",
    color: "#fff",
  },
  price: {
    fontSize: "1.1rem",
    color: "#00d0ff",
    fontWeight: "700",
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    margin: "0.5rem 0",
  },
  qtyBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  qtyText: {
    fontSize: "1rem",
    fontWeight: "700",
    minWidth: "34px",
    textAlign: "center",
  },
  removeBtn: {
    marginTop: "auto",
    padding: "0.6rem",
    borderRadius: "8px",
    border: "none",
    background: "rgba(255, 59, 59, 0.85)",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  totalContainer: {
    background: "rgba(255,255,255,0.02)",
    borderRadius: "12px",
    padding: "1rem",
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    border: "1px solid rgba(255,255,255,0.04)",
  },
  total: {
    fontSize: "1.2rem",
    color: "#fff",
    textAlign: "center",
    marginBottom: "0",
  },
  clearBtn: {
    padding: "0.8rem",
    borderRadius: "8px",
    border: "none",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
  },
};

const componentCss = `
.cp-root { --accent: #00d0ff; }
.cp-hero { display:flex; justify-content:space-between; align-items:center; gap:12px }
.cp-sub { color: rgba(255,255,255,0.65); margin:4px 0 0 }
.cp-actions { display:flex; gap:8px }
.btn{padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--accent);cursor:pointer;font-weight:700}
.btn.primary{background:linear-gradient(90deg,#00c3ff,#3a7bd5);color:#042b40;border:none;box-shadow:0 6px 18px rgba(58,123,213,0.14)}
.btn.ghost{background:transparent;border:1px solid rgba(255,255,255,0.06);color:#cfefff}
.btn.glass{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));}

.cp-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:28px;border-radius:12px;border:1px solid rgba(255,255,255,0.03);background:linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005))}
.muted{color:rgba(255,255,255,0.65)}
.small{font-size:13px}

.cp-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;margin-top:18px}
@media (max-width:900px){ .cp-grid{grid-template-columns:1fr} }

.cp-list{display:flex;flex-direction:column;gap:14px}
.cp-card{display:flex;gap:12px;align-items:center;padding:12px;border-radius:12px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.03)}
.cp-img{width:160px;height:120px;object-fit:contain;border-radius:8px;background:rgba(255,255,255,0.02);padding:8px}
.cp-meta{flex:1;display:flex;flex-direction:column;gap:8px}
.cp-top{display:flex;justify-content:space-between;align-items:flex-start}
.cp-title{margin:0;font-size:1rem}
.cp-price .big{color:var(--accent);font-weight:800}

.cp-controls{display:flex;align-items:center;justify-content:space-between;gap:12px}
.qty{display:flex;align-items:center;gap:8px}
.qty button{width:40px;height:36px;border-radius:10px;border:none;background:rgba(255,255,255,0.03);cursor:pointer;font-weight:800}
.qty .num{min-width:36px;text-align:center;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.02)}
.row-actions{display:flex;gap:10px}
.row-actions .link{background:transparent;border:none;color:rgba(255,255,255,0.8);cursor:pointer}

.cp-footer{margin-top:8px}
.cp-footer-inner{display:flex;justify-content:space-between;align-items:center;gap:12px}
.cp-footer-actions{display:flex;gap:8px}

.cp-aside .cp-summary{padding:16px;border-radius:12px;background:linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005));border:1px solid rgba(255,255,255,0.03)}
.total-line{display:flex;justify-content:space-between;margin-top:8px}
`;

export default Cart;


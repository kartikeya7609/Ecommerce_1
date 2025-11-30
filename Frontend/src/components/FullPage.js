import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductPage.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_CART_API =
  (process.env.REACT_APP_API_BASE || "http://localhost:3002") + "/api/cart";

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tokenFromStorage = localStorage.getItem("token");
  const userFromStorage = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cartItems")) || [];
    } catch {
      return [];
    }
  });
  const isAuthenticated = !!tokenFromStorage;
  const token = tokenFromStorage;
  const user = userFromStorage;
  const showToast = (msg, delay = 2000) => {
    toast.info(msg, { autoClose: delay });
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.error("Session expired — please login");
    navigate("/login");
  };

  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch (err) {
      console.error("Failed to persist cart to localStorage:", err);
    }
  }, [cartItems]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`https://fakestoreapi.com/products/${id}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Failed to fetch product (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch product:", err);
          setError("Could not load product. Please try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // graceful image fallback
  const handleImgError = (e) => {
    e.currentTarget.src = "/logo192.png";
  };

  const addToCart = async (p = product) => {
    if (!p) return;

    const useServer = Boolean(token);

    // Build updated cart optimistically
    const existingIndex = cartItems.findIndex((it) => +it.id === +p.id);
    let optimisticCart;
    if (existingIndex >= 0) {
      optimisticCart = cartItems.map((it, i) =>
        i === existingIndex ? { ...it, quantity: (it.quantity || 1) + 1 } : it
      );
    } else {
      optimisticCart = [...cartItems, { ...p, quantity: 1 }];
    }

    setCartItems(optimisticCart);
    setSaving(true);

    if (!useServer) {
      showToast("Added to cart (local)");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        productId: p.id,
        title: p.title,
        price: p.price,
        image: p.image,
        quantity: existingIndex >= 0 ? optimisticCart[existingIndex].quantity : 1,
      };

      const resp = await fetch(BACKEND_CART_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (resp.status === 401) {
        setCartItems((prev) => {
          if (existingIndex >= 0) {
            return prev.map((it, i) =>
              i === existingIndex ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it
            );
          } else {
            return prev.filter((it) => it.id !== p.id);
          }
        });
        handleUnauthorized();
        return;
      }

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || `Server error (${resp.status})`);
      }

      const respJson = await resp.json().catch(() => null);
      if (respJson?.items && Array.isArray(respJson.items)) {
        const formatted = respJson.items.map((it) => ({
          id: it.id ?? it.product_id,
          title: it.title ?? it.name,
          price: Number(it.price) || 0,
          image: it.image || "/logo192.png",
          quantity: it.quantity || 1,
        }));
        setCartItems(formatted);
        showToast("Added to cart");
      } else {
        showToast("Added to cart");
      }
    } catch (err) {
      console.error("Cart update error:", err);
      // rollback optimistic update
      setCartItems((prev) => {
        // try revert by finding the product and decreasing quantity or removing
        const idx = prev.findIndex((it) => +it.id === +p.id);
        if (idx === -1) return prev;
        const item = prev[idx];
        if ((item.quantity || 1) > 1) {
          return prev.map((it, i) => (i === idx ? { ...it, quantity: it.quantity - 1 } : it));
        } else {
          return prev.filter((it) => +it.id !== +p.id);
        }
      });
      toast.error(err.message || "Failed to update cart. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const buyNow = () => {
    if (!product) return;
    localStorage.setItem("checkoutItem", JSON.stringify({ ...product, quantity: 1 }));
    toast.info("Proceeding to checkout");
    setTimeout(() => navigate("/checkout"), 600);
  };

  // keyboard accessibility handler for buttons
  const onKeyPressBtn = (e, fn) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="pp-page">
        <ToastContainer />
        <div className="pp-container pp-loading">
          <div className="pp-skeleton-image skeleton"></div>
          <div className="pp-skeleton-info">
            <div className="skeleton short"></div>
            <div className="skeleton mid"></div>
            <div className="skeleton long"></div>
            <div className="skeleton btn"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-page">
        <ToastContainer />
        <div className="pp-container pp-error">
          <p>{error}</p>
          <div className="pp-error-actions">
            <button className="pp-btn ghost" onClick={() => window.location.reload()}>
              Retry
            </button>
            <button className="pp-btn" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pp-page">
        <ToastContainer />
        <div className="pp-container pp-error">
          <p>Product not found</p>
          <button className="pp-btn" onClick={() => navigate("/products")}>
            Browse products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page" role="main" aria-labelledby="pp-title">
      <ToastContainer />
      <div className="pp-container">
        <div className="pp-imageSection">
          <img
            src={product.image}
            alt={product.title}
            className="pp-image"
            onError={handleImgError}
          />
        </div>

        <div className="pp-infoSection">
          <h1 id="pp-title" className="pp-title">
            {product.title}
          </h1>

          <p className="pp-category">{product.category}</p>

          <p className="pp-price">${Number(product.price).toFixed(2)}</p>

          <p className="pp-description">{product.description}</p>

          <div className="pp-controls">
            <button
              className="pp-btn primary"
              onClick={() => addToCart(product)}
              onKeyDown={(e) => onKeyPressBtn(e, () => addToCart(product))}
              disabled={saving}
              aria-disabled={saving}
            >
              {saving ? "Adding…" : "🛒 Add to Cart"}
            </button>

            <button
              className="pp-btn secondary"
              onClick={buyNow}
              onKeyDown={(e) => onKeyPressBtn(e, buyNow)}
            >
              💳 Buy Now
            </button>

            <button
              className="pp-btn ghost"
              onClick={() => navigate("/products")}
              aria-label="Continue shopping"
            >
              ← Continue shopping
            </button>
          </div>

          <div className="pp-meta">
            <div>
              <strong>Rating: </strong>
              <span>{product.rating?.rate ?? "—"}</span>
              <span className="muted"> ({product.rating?.count ?? 0} reviews)</span>
            </div>
            <div>
              <strong>SKU:</strong> <span className="muted">FS-{product.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;

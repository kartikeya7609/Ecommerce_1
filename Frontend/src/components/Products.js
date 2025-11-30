import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Products.css"; // Make sure to create this CSS file

const API_URL = "https://fakestoreapi.com/products";
const BACKEND_API_BASE = "http://localhost:3002/api";
const BACKEND_CART_API = `${BACKEND_API_BASE}/cart`;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch(API_URL);
        if (!productsResponse.ok) throw new Error("Failed to fetch products");
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Check authentication and fetch cart
        if (isAuthenticated && user?.id && token) {
          await fetchCartFromBackend(user.id, token);
        } else {
          // Load from local storage if not authenticated
          const localCart = JSON.parse(localStorage.getItem("cartItems")) || [];
          setCartItems(localCart);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showToast("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, token]);

  const fetchCartFromBackend = async (userId, token) => {
    try {
      // Use the correct endpoint - just BACKEND_CART_API without userId
      const res = await fetch(`${BACKEND_CART_API}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch cart");

      const cartData = await res.json();
      console.log('Cart data fetched successfully:', cartData);
      setCartItems(cartData.items || []);
      localStorage.setItem("cartItems", JSON.stringify(cartData.items || []));
    } catch (err) {
      console.error("Cart fetch error:", err);
      const localCart = JSON.parse(localStorage.getItem("cartItems")) || [];
      setCartItems(localCart);
      if (err.message !== "No authentication token") {
        showToast("Couldn't load cart from server. Using local data.");
      }
    }
  };

  const handleUnauthorized = () => {
    showToast("Session expired. Please login again.");
    navigate("/login");
  };

  const showToast = (message, duration = 2000) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), duration);
  };

  const addToCart = async (product) => {
    if (!isAuthenticated || !user) {
      showToast("Please login to add items to cart", 3000);
      navigate("/login");
      return;
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.id === product.id
    );
    let updatedCart;

    if (existingItemIndex >= 0) {
      updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += 1;
    } else {
      updatedCart = [...cartItems, { ...product, quantity: 1 }];
    }

    setCartItems(updatedCart);
    localStorage.setItem("cartItems", JSON.stringify(updatedCart));

    try {
      const response = await fetch(`${BACKEND_CART_API}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity:
            existingItemIndex >= 0
              ? updatedCart[existingItemIndex].quantity
              : 1,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update cart");
      }

      showToast("Item added to cart!");
    } catch (error) {
      console.error("Cart update error:", error);
      // Revert to previous cart state
      setCartItems(cartItems);
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      showToast(error.message || "Failed to update cart. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      {isAuthenticated && user && (
        <div className="user-email">Logged in as: {user.email}</div>
      )}

      {toastVisible && (
        <div className={`toast ${toastVisible ? "show" : ""}`}>
          {toastMessage}
        </div>
      )}

      <h1 className="products-heading">Our Products</h1>

      <div className="products-grid">
        {products.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <img
              src={product.image}
              alt={product.title}
              className="product-image"
            />
            <h2 className="product-title">{product.title}</h2>
            <p className="product-description">
              {product.description.length > 100
                ? `${product.description.substring(0, 100)}...`
                : product.description}
            </p>
            <p className="product-price">${product.price}</p>
            <button
              className={`add-to-cart-btn ${
                !isAuthenticated ? "disabled" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              disabled={!isAuthenticated}
            >
              {isAuthenticated ? "Add To Cart" : "Login to Add"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;

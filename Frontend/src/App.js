import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Register from "./components/Register";
import Contact from "./components/Contact";
import Products from "./components/Products";
import Home from "./components/Home";
import Cart from "./components/Cart";
import ProductPage from "./components/FullPage";
import UserProfile from "./components/UserProfile";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./components/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

function App() {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const PublicRoute = ({ children }) => {
    if (isAuthenticated) {
      return <Navigate to="/user-profile" replace />;
    }
    return children;
  };

  useEffect(() => {
    const loadCart = async () => {
      if (!isAuthenticated) {
        setCart([]);
        setLoading(false);
        return;
      }

      try {
        // Make sure we're using the full URL with the correct endpoint
        const response = await axios.get("http://localhost:3002/api/cart", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setCart(response.data.items || []);
      } catch (error) {
        console.error("Cart load error:", error);
        setCart([]);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated]);

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3002/api/cart", {
        productId,
        quantity,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCart(response.data.items || []);
      toast.success("Product added to cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add product to cart");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`http://localhost:3002/api/cart/${productId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCart(response.data.items || []);
      toast.success("Product removed from cart");
    } catch (error) {
      console.error("Remove from cart error:", error);
      toast.error("Failed to remove product from cart");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:3002/api/cart/${productId}`, {
        quantity: newQuantity,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCart(response.data.items || []);
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Update quantity error:", error);
      toast.error("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HeroSection />} />
          <Route path="/home" element={<Home />} />
          <Route
            path="/products"
            element={<Products handleAddToCart={handleAddToCart} />}
          />
          <Route
            path="/product/:id"
            element={<ProductPage handleAddToCart={handleAddToCart} />}
          />
          <Route path="/contact" element={<Contact />} />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route
            path="/user-profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart
                  cartItems={cart}
                  onRemove={handleRemoveFromCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  isLoading={loading}
                />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

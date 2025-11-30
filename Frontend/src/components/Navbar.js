import { useNavigate, Link } from "react-router-dom";
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import "../App.css";
import "./Navbar.css";

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://fakestoreapi.com/products");
      if (!res.ok) throw new Error("Network response was not ok");
      const products = await res.json();
      const match = products.find((p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (match) {
        navigate(`/product/${match.id}`);
      } else {
        alert("No matching product found");
      }
    } catch (err) {
      setError("Failed to fetch products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <div style={{ height: "70px" }}></div>
      <nav className="navbar navbar-expand-lg custom-navbar fixed-top bg-dark">
        <div className="container">
          <Link className="navbar-brand text-white" to="/">
            ShopSphere
          </Link>
          <button
            className="navbar-toggler mobile-menu-btn"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="nav-links navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/">
                  <i className="fas fa-info-circle"></i> About
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/home">
                  <i className="fas fa-store"></i> Home
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link text-white" to="/cart">
                      <i className="fas fa-shopping-cart"></i> Cart
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-white" to="/user-profile">
                      <i className="fas fa-user"></i> Profile
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link text-white border-0 bg-transparent"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link text-white" to="/login">
                      <i className="fa-solid fa-right-to-bracket"></i> Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-white" to="/register">
                      <i className="fa-solid fa-user-plus"></i> Register
                    </Link>
                  </li>
                </>
              )}
              <li className="nav-item">
                <Link className="nav-link text-white" to="/contact">
                  <i className="fas fa-phone"></i> Contact
                </Link>
              </li>
            </ul>
            <div className="d-flex gap-10px">
              <form className="d-flex" role="search" onSubmit={handleSearch}>
                <input
                  className="form-control me-2"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="btn btn-outline-success"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

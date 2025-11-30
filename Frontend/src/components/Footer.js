import React from "react";
import "./Footer.css";
export default function Footer() {
  return (
    <div className="bg-dark p-5 text-light footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Join my network!</h3>
          <div className="social-apps">
            <a
              href="https://www.linkedin.com/in/meher-sri-kartikeya-kotha-135997217?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              target="_blank"
              rel="noopener noreferrer"
              className="social-app"
            >
              <i className="fab fa-linkedin"></i>
              <span>LinkedIn</span>
            </a>
            <a
              href="https://github.com/kartikeya7609"
              target="_blank"
              rel="noopener noreferrer"
              className="social-app"
            >
              <i className="fab fa-github"></i>
              <span>GitHub</span>
            </a>
            <a
              href="https://x.com/kotha_mehe43188?t=lrtyEi8LmHWoNPbtlLMfYQ&s=09"
              target="_blank"
              rel="noopener noreferrer"
              className="social-app"
            >
              <i className="fa-solid fa-x"></i>
              <span>X</span>
            </a>
            <a
              href="https://www.instagram.com/k_m_s_k_7"
              target="_blank"
              rel="noopener noreferrer"
              className="social-app"
            >
              <i className="fab fa-instagram"></i>
              <span>Instagram</span>
            </a>
          </div>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>

          <div className="footer-links">
            <div className="quick-links-column">
              <a href="/about">
                <i className="fas fa-user"></i> About
              </a>
              <a href="/home">
                <i className="fas fa-home"></i> Home
              </a>
              <a href="/cart">
                <i className="fas fa-shopping-cart"></i> Cart
              </a>
            </div>
            <div className="quick-links-column">
              <a href="/login">
                <i className="fas fa-store"></i> Login
              </a>
              <a href="/register">
                <i className="fas fa-store"></i> Register
              </a>
              <a href="/contact">
                <i className="fas fa-envelope"></i> Contact
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 Kartikeya. All rights reserved.</p>
        <p>
          Built with <i className="fas fa-heart"></i> and
          <i className="fas fa-code"></i>
        </p>
      </div>
    </div>
  );
}

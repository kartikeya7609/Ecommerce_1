import React, { useEffect } from "react";
import "./HeroSection.css"; // Link your custom CSS

export default function HeroSection() {
  useEffect(() => {
    const typingText = document.querySelector(".typing-text");
    const texts = [
      "Great Deals Every Day",
      "Fast & Free Delivery",
      "Trusted by Thousands",
      "Shop Smart with ShopSphere",
    ];
    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
      const currentText = texts[currentTextIndex];

      if (isDeleting) {
        typingText.textContent = currentText.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        typingSpeed = 50;
      } else {
        typingText.textContent = currentText.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typingSpeed = 100;
      }

      if (!isDeleting && currentCharIndex === currentText.length) {
        isDeleting = true;
        typingSpeed = 1500;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentTextIndex = (currentTextIndex + 1) % texts.length;
        typingSpeed = 500;
      }

      setTimeout(type, typingSpeed);
    }

    setTimeout(type, 1000);
  }, []);

  return (
    <section className="hero-section d-flex align-items-center justify-content-center text-white login-bg">
      <div className="overlay"></div>
      <div className="container text-center content">
        <h1 className="display-3 fw-bold mb-3">
          Welcome to <span className="text-highlight">ShopSphere</span>
        </h1>
        <p className="lead fs-4 mb-3">
          <i className="fas fa-shopping-cart me-2"></i>Electronics, Fashion,
          Home & More
        </p>
        <div className="typing-container mb-3">
          <span className="typing-text"></span>
          <span className="typing-cursor">|</span>
        </div>
        <p className="mb-4">
          <i className="fas fa-map-marker-alt me-2"></i>Delivering Across India
        </p>
        <a href="/home" className="btn btn-primary btn-lg shadow">
          <i className="fas fa-arrow-right me-2"></i>Start Shopping
        </a>
        <p className="mt-4 description">
          ShopSphere: A sleek, modern shopping platform offering curated
          products, seamless experience, vibrant design, and effortless cart
          management with style.
        </p>
      </div>
    </section>
  );
}

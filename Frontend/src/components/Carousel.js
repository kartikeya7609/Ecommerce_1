import React from "react";

const Carousel = () => {
  return (
    <div className="container p-2">
      <div style={styles.page}>
        <div
          id="carouselExampleCaptions"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          {/* Indicators */}
          <div className="carousel-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                data-bs-target="#carouselExampleCaptions"
                data-bs-slide-to={index}
                className={index === 0 ? "active" : ""}
                aria-current={index === 0 ? "true" : undefined}
                aria-label={`Slide ${index + 1}`}
              ></button>
            ))}
          </div>

          {/* Carousel Slides */}
          <div className="carousel-inner rounded shadow-sm">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`carousel-item ${index === 0 ? "active" : ""}`}
              >
                <img
                  src={slide.image}
                  className="d-block w-100 img-fluid rounded"
                  alt={`Slide ${index + 1}`}
                />
                <div className="carousel-caption d-none d-md-block bg-dark bg-opacity-50 p-3 rounded">
                  <h5>{slide.title}</h5>
                  <p>{slide.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleCaptions"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleCaptions"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Slide data
// ...existing code...

// Slide data
const slides = [
  {
    image:
      "https://images-eu.ssl-images-amazon.com/images/G/31/sthaneka/SVM/ncq/2X_buasdhuif._CB795788272_.jpg",
    title: "Shop the Latest Electronics",
    description: "Discover top deals on smartphones, laptops, and more.",
  },
  {
    image:
      "https://images-eu.ssl-images-amazon.com/images/G/31/img23/Beauty/GW/yesbank/Shampoos__conditioners_pc._CB796616147_.png",
    title: "Beauty & Personal Care",
    description: "Explore trending beauty products and exclusive offers.",
  },
  {
    image:
      "https://images-eu.ssl-images-amazon.com/images/G/31/img21/MA2025/GW/BAU/Unrec/PC/934044815._CB551384116_.jpg",
    title: "Fashion for Everyone",
    description: "Upgrade your wardrobe with the latest styles.",
  },
  {
    image:
      "https://images-eu.ssl-images-amazon.com/images/G/31/img22/Wireless/devjyoti/GW/Uber/Nov/uber_new_high._CB537689643_.jpg",
    title: "Home Essentials",
    description: "Find everything you need for a comfortable home.",
  },
  {
    image:
      "https://images-eu.ssl-images-amazon.com/images/G/31/img23/Consumables/X-GL/Feb5/PC_Hero_1_3000._CB582457311_.jpg",
    title: "Daily Groceries",
    description: "Shop fresh groceries and household supplies.",
  },
];

// ...existing code...

// Styles for the outer container
const styles = {
  page: {
    padding: "1rem 1rem 1rem 1rem",
    background: "linear-gradient(to bottom right, #f0f4f8, #d9e2ec)",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
    fontFamily: "Segoe UI, sans-serif",
    overflow: "hidden",
  },
};

export default Carousel;

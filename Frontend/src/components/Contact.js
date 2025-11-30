import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "../App.css";
import "./Contact.css";

const ContactPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setStatus({
        type: "error",
        message: "Please login to send a message",
      });
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("https://ecommerce-1-zz8i.onrender.com/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus({
          type: "success",
          message: "✅ Message sent successfully!",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus({
          type: "error",
          message: `❌ ${result.error || "Failed to send message"}`,
        });
      }
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus({
        type: "error",
        message: "❌ Failed to send message. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper} className="contact-bg">
      <div style={styles.container}>
        <h1 style={styles.heading}>Contact Us</h1>

        {status.message && (
          <div
            style={{
              marginBottom: "1rem",
              color: status.type === "error" ? "#ff6b6b" : "#00f5c3",
              fontWeight: "bold",
              textAlign: "center",
              padding: "1rem",
              borderRadius: "8px",
              backgroundColor:
                status.type === "error"
                  ? "rgba(255, 107, 107, 0.1)"
                  : "rgba(0, 245, 195, 0.1)",
              border: `1px solid ${
                status.type === "error" ? "#ff6b6b" : "#00f5c3"
              }`,
            }}
          >
            {status.message}
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            style={styles.input}
            required
            disabled={!isAuthenticated}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            required
            disabled={!isAuthenticated}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            style={styles.textarea}
            required
            disabled={!isAuthenticated}
          ></textarea>
          <button
            type="submit"
            style={styles.button}
            disabled={loading || !isAuthenticated}
          >
            {loading
              ? "Sending..."
              : isAuthenticated
              ? "Send Message"
              : "Please Login to Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    background:
      "linear-gradient(135deg, var(--bg-primary), var(--bg-secondary))",
    fontFamily: "Segoe UI, sans-serif",
  },
  container: {
    backdropFilter: "blur(16px)",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    padding: "2.5rem",
    maxWidth: "500px",
    width: "100%",
    color: "var(--text-primary)",
    transition: "all 0.3s ease-in-out",
  },
  heading: {
    fontSize: "2.8rem",
    textAlign: "center",
    marginBottom: "1.8rem",
    color: "var(--text-primary)",
    textShadow: "0 0 8px var(--neon-glow)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
  },
  input: {
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontSize: "1rem",
    transition: "all 0.2s ease-in-out",
    outline: "none",
  },
  textarea: {
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontSize: "1rem",
    resize: "none",
    outline: "none",
    transition: "all 0.2s ease-in-out",
  },
  button: {
    padding: "1rem",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "var(--accent-color)",
    color: "var(--text-button)",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "transform 0.2s ease-in-out",
  },
};

export default ContactPage;


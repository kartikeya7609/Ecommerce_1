import React from 'react';
import '../App.css'; 

export default function ForgotPassword() {
  return (
    <div className="forgot-container d-flex align-items-center justify-content-center vh-100">
      <div className="forgot-card p-4 rounded shadow">
        <h2 className="text-center mb-4">Reset Password</h2>
          <p className="text-danger text-center mb-3 ">
             <i> Don't worry, we'll send you an email with a link to reset your password.</i>
          </p>
        <form>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="d-grid">
            <button type="submit" className="btn reset-btn">Send Reset Link</button>
          </div>
        </form>
        <p className="mt-3 text-center redirect">
          <a href="/login" className="redirect">Back to Login</a>
        </p>
      </div>
    </div>
  );
}

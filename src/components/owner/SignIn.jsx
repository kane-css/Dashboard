import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Sun, Moon } from "lucide-react";
import modifikasiLogo from "../../assets/modifikasi-logo.png";
import "../ownercss/Auth.css";
import { supabase } from "../../supabase";

export default function SignIn({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  const navigate = useNavigate();

  // ✅ Theme handler
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // ✅ Validate email
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ✅ Handle login (no redirect flicker)
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) return Swal.fire("Error", "Email is required.", "warning");
    if (!validateEmail(email)) return Swal.fire("Error", "Invalid email format.", "warning");
    if (!password) return Swal.fire("Error", "Password is required.", "warning");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) return Swal.fire("Log In Failed", authError.message, "error");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", authData.user.id)
      .single();

    if (profileError) return Swal.fire("Error", "User profile not found.", "error");

    if (profile.status === "pending") {
      await supabase.auth.signOut();
      return Swal.fire("Account Pending", "Your account is awaiting approval.", "info");
    }

    if (profile.status === "suspended") {
      await supabase.auth.signOut();
      return Swal.fire("Account Suspended", "This account is suspended.", "warning");
    }

    onLogin(profile.role); // ✅ triggers navigation in App.jsx
    Swal.fire("Success", "Login successful!", "success");
  };

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleLogin}>
        <img src={modifikasiLogo} alt="Logo" className="auth-logo" />
        <h2 className="auth-title">Sign In</h2>

        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="auth-button">Login</button>

        <p
          className="forgot-pass"
          onClick={() => setShowForgotModal(true)}
          style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline" }}
        >
          Forgot Password?
        </p>

        <p className="switch-auth">
          Don't have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/signup", { replace: true })}>
            Sign Up
          </span>
        </p>
      </form>

      <button
        className={`toggle-btn ${isDark ? "dark-mode" : "light-mode"}`}
        onClick={() => setIsDark(!isDark)}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Forgot Password</h3>
            <p style={{ fontSize: "0.9rem", color: "#777" }}>
              You’ll receive a password reset link to your email.
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              className="auth-button"
              onClick={async () => {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: "http://localhost:5173/resetpassword",
                });
                if (error) Swal.fire("Error", error.message, "error");
                else Swal.fire("Email Sent", "Check your email for reset link.", "success");
              }}
            >
              Send Reset Link
            </button>

            <p
              className="modal-close"
              onClick={() => setShowForgotModal(false)}
              style={{ marginTop: "10px", cursor: "pointer", color: "red" }}
            >
              Cancel
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState(""); // Store email for reset
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

  // ✅ Handle sending reset code
  const handleSendResetCode = async () => {
    if (!email.trim()) {
      Swal.fire("Error", "Please enter your email", "warning");
      return;
    }
    if (!validateEmail(email)) {
      Swal.fire("Error", "Invalid email format", "warning");
      return;
    }

    // Modified: Remove redirectTo to send OTP code instead of link
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      Swal.fire("Error", error.message, "error");
    } else {
      setResetEmail(email); // Save email for password reset
      setShowForgotModal(false);
      setShowChangePasswordModal(true);
      Swal.fire("Code Sent", "Check your email for the reset code.", "success");
    }
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

      {/* Forgot Password Modal - Step 1: Send Reset Code */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Forgot Password</h3>
            <p style={{ fontSize: "0.9rem", color: "#777" }}>
              You'll receive a password reset code to your email.
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
              onClick={handleSendResetCode}
            >
              Send Reset Code
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

      {/* Change Password Modal - Step 2: Enter Code and New Password */}
      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Change Password</h3>
            <p style={{ fontSize: "0.9rem", color: "#777" }}>
              Enter the reset code from your email and your new password.
            </p>

            <input
              type="text"
              placeholder="Enter Reset Code"
              className="auth-input"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
            />

            <input
              type="password"
              placeholder="New Password"
              className="auth-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              className="auth-button"
              onClick={async () => {
                if (!resetCode.trim()) {
                  Swal.fire("Error", "Please enter the reset code", "error");
                  return;
                }
                if (!newPassword.trim() || !confirmPassword.trim()) {
                  Swal.fire("Error", "Please fill in all password fields", "error");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  Swal.fire("Error", "Passwords do not match", "error");
                  return;
                }
                if (newPassword.length < 6) {
                  Swal.fire("Error", "Password must be at least 6 characters", "error");
                  return;
                }

                const { error } = await supabase.auth.verifyOtp({
                  email: resetEmail,
                  token: resetCode,
                  type: 'recovery'
                });

                if (error) {
                  Swal.fire("Error", "Invalid reset code", "error");
                  return;
                }

                const { error: updateError } = await supabase.auth.updateUser({
                  password: newPassword
                });

                if (updateError) {
                  Swal.fire("Error", updateError.message, "error");
                } else {
                  // ✅ Sign out after successful password change to prevent auto-login
                  await supabase.auth.signOut();
                  Swal.fire("Success", "Password changed successfully! Please log in with your new password.", "success");
                  setShowChangePasswordModal(false);
                  setResetCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setResetEmail("");
                  // ✅ Navigate back to sign-in page
                  navigate("/signin", { replace: true });
                }
              }}
            >
              Change Password
            </button>

            <p
              className="modal-close"
              onClick={() => {
                setShowChangePasswordModal(false);
                setResetCode("");
                setNewPassword("");
                setConfirmPassword("");
                setResetEmail("");
              }}
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
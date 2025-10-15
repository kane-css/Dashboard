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
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [stage, setStage] = useState("email"); // email → code → reset
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  const navigate = useNavigate();

  // ---- Theme handling ----
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // ---- Check for active session ----
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();

        if (profile) {
          const redirectPath =
            profile.role === "owner" ? "/dashboard" : "/admin-dashboard";
          navigate(redirectPath, { replace: true });

          window.history.pushState(null, "", window.location.href);
          window.addEventListener("popstate", () => {
            window.history.pushState(null, "", window.location.href);
          });
        }
      }
    };
    checkSession();
  }, [navigate]);

  // ---- Email validator ----
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ---- Handle login ----
  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim())
      return Swal.fire("Validation Error", "Email is required.", "warning");
    if (!validateEmail(email))
      return Swal.fire("Validation Error", "Please enter a valid email.", "warning");
    if (!password)
      return Swal.fire("Validation Error", "Password is required.", "warning");
    if (password.length < 6)
      return Swal.fire("Validation Error", "Password must be at least 6 characters.", "warning");

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

    if (profileError)
      return Swal.fire("Profile Not Found", "Your user profile doesn't exist.", "error");
    if (profile.status === "pending") {
      await supabase.auth.signOut();
      return Swal.fire("Account Pending", "Your account is still awaiting approval.", "info");
    }
    if (profile.status === "suspended") {
      await supabase.auth.signOut();
      return Swal.fire("Account Suspended", "This account is suspended.", "warning");
    }

    onLogin(profile.role);
    const redirectPath = profile.role === "owner" ? "/dashboard" : "/admin-dashboard";
    navigate(redirectPath, { replace: true });

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", () => {
      window.history.pushState(null, "", window.location.href);
    });
  };

  // ---- Forgot Password Flow (using reset code) ----
  const handleSendResetCode = async () => {
    if (!validateEmail(resetEmail))
      return Swal.fire("Invalid Email", "Please enter a valid email address.", "warning");

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await supabase.from("password_reset_codes").insert([
      {
        email: resetEmail,
        code: resetCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
      },
    ]);

    if (error) {
      console.error(error);
      Swal.fire("Error", "Failed to send reset code.", "error");
      return;
    }

    Swal.fire(
      "Reset Code Sent",
      `A 6-digit reset code was sent to ${resetEmail}. (For testing: ${resetCode})`,
      "info"
    );
    setResetCode(resetCode);
    setStage("code");
  };

  const handleVerifyCode = () => {
    if (enteredCode.trim() !== resetCode)
      return Swal.fire("Error", "Incorrect code. Please try again.", "error");

    Swal.fire("Verified", "Code verified. You can now reset your password.", "success");
    setStage("reset");
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6)
      return Swal.fire("Error", "Password must be at least 6 characters.", "warning");
    if (newPassword !== confirmPassword)
      return Swal.fire("Error", "Passwords do not match.", "warning");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }

    Swal.fire("Success", "Password has been reset successfully!", "success");
    setShowForgotModal(false);
    setStage("email");
    setResetEmail("");
    setResetCode("");
    setEnteredCode("");
    setNewPassword("");
    setConfirmPassword("");
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
          required
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="auth-button">
          Login
        </button>

        <p className="forgot-pass" onClick={() => setShowForgotModal(true)}>
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
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Forgot Password</h3>

            {stage === "email" && (
              <>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="auth-input"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button className="auth-button" onClick={handleSendResetCode}>
                  Send Reset Code
                </button>
              </>
            )}

            {stage === "code" && (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="auth-input"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                />
                <button className="auth-button" onClick={handleVerifyCode}>
                  Verify Code
                </button>
              </>
            )}

            {stage === "reset" && (
              <>
                <input
                  type="password"
                  placeholder="New Password"
                  className="auth-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="auth-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button className="auth-button" onClick={handleResetPassword}>
                  Reset Password
                </button>
              </>
            )}

            <p className="modal-close" onClick={() => setShowForgotModal(false)}>
              Cancel
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  const navigate = useNavigate();

  // ✅ Apply dark mode globally and save preference
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // ✅ Redirect if already logged in
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

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  // ---- Forgot Password Flow ----
  const handleSendResetCode = async () => {
    if (!validateEmail(resetEmail))
      return Swal.fire("Invalid Email", "Please enter a valid email address.", "warning");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setResetCode(code);

    Swal.fire(
      "Verification Code Sent",
      `A 6-digit verification code has been sent to ${resetEmail}. (For testing, your code is: ${code})`,
      "info"
    );

    setResetStep(2);
  };

  const handleVerifyCode = () => {
    if (enteredCode !== resetCode)
      return Swal.fire("Invalid Code", "The verification code is incorrect.", "error");
    setResetStep(3);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6)
      return Swal.fire("Weak Password", "Password must be at least 6 characters.", "warning");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return Swal.fire("Error", error.message, "error");

    Swal.fire("Success", "Your password has been updated.", "success");
    setShowForgotModal(false);
    setResetStep(1);
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

        <button type="submit" className="auth-button">Login</button>

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

      {/* ✅ Always visible dark mode toggle */}
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
            {resetStep === 1 && (
              <>
                <h3>Forgot Password</h3>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="auth-input"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button className="auth-button" onClick={handleSendResetCode}>
                  Send Code
                </button>
              </>
            )}

            {resetStep === 2 && (
              <>
                <h3>Verify Code</h3>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="auth-input"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                />
                <button className="auth-button" onClick={handleVerifyCode}>
                  Verify
                </button>
              </>
            )}

            {resetStep === 3 && (
              <>
                <h3>Set New Password</h3>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="auth-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button className="auth-button" onClick={handleUpdatePassword}>
                  Update Password
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

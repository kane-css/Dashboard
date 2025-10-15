import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import modifikasiLogo from "../../assets/modifikasi-logo.png";
import "../ownercss/Auth.css";
import { Moon, Sun } from "lucide-react";
import { supabase } from "../../supabase";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  const navigate = useNavigate();

  // ✅ Apply dark mode globally and store preference
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
        }
      }
    };
    checkSession();
  }, [navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignUp = async (event) => {
    event.preventDefault();

    if (!fullName.trim())
      return Swal.fire("Validation Error", "Please enter your full name.", "warning");
    if (!email.trim())
      return Swal.fire("Validation Error", "Please enter your email.", "warning");
    if (!validateEmail(email))
      return Swal.fire("Validation Error", "Please enter a valid email address.", "warning");
    if (!password)
      return Swal.fire("Validation Error", "Please enter your password.", "warning");
    if (password.length < 6)
      return Swal.fire("Validation Error", "Password must be at least 6 characters long.", "warning");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (authError)
        return Swal.fire("Sign Up Failed", authError.message, "error");

      await supabase.auth.signOut();

      await Swal.fire({
        title: "Success!",
        text: "Your account application has been submitted and is awaiting approval.",
        icon: "info",
        confirmButtonColor: "#000000",
      });

      navigate("/signin", { replace: true });
    } catch (error) {
      Swal.fire("Error", "An unexpected error occurred. Please try again.", "error");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleSignUp}>
        <img src={modifikasiLogo} alt="Logo" className="auth-logo" />
        <h2 className="auth-title">Sign Up</h2>

        <input
          type="text"
          className="auth-input"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

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
          Create Account
        </button>

        <p className="switch-auth">
          Already have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/signin")}>
            Sign In
          </span>
        </p>
      </form>

      {/* ✅ Always visible toggle button */}
      <button
        className={`toggle-btn ${isDark ? "dark-mode" : "light-mode"}`}
        onClick={() => setIsDark(!isDark)}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </div>
  );
}

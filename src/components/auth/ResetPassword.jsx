import React, { useState } from "react";
import { supabase } from "../../supabase";
import Swal from "sweetalert2";
import "../auth/ResetPassword.css";
 
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState("email"); // "email" -> "code" -> "reset"
  const [loading, setLoading] = useState(false);

  // ✅ Step 1: Send reset code
  const handleSendResetCode = async () => {
    if (!email.trim()) {
      Swal.fire("Error", "Please enter your email.", "warning");
      return;
    }

    setLoading(true);
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await supabase.from("password_reset_codes").insert([
      {
        email,
        code: resetCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
      },
    ]);

    setLoading(false);

    if (error) {
      Swal.fire("Error", "Failed to send reset code.", "error");
      console.error(error);
      return;
    }

    Swal.fire(
      "Reset Code Sent",
      `A 6-digit reset code was sent to ${email}. (For testing: ${resetCode})`,
      "info"
    );
    setCode(resetCode);
    setStage("code");
  };

  // ✅ Step 2: Verify reset code
  const handleVerifyCode = () => {
    if (enteredCode.trim() !== code) {
      Swal.fire("Error", "The code you entered is incorrect.", "error");
      return;
    }

    Swal.fire("Success", "Code verified. You can now set a new password.", "success");
    setStage("reset");
  };

  // ✅ Step 3: Reset password
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Swal.fire("Error", "Password must be at least 6 characters.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire("Error", "Passwords do not match.", "warning");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }

    Swal.fire("Success", "Password has been reset successfully!", "success");
    setStage("email");
    setEmail("");
    setCode("");
    setEnteredCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="forgot-container">
      <h2 className="forgot-title">Forgot Password</h2>

      {/* Step 1: Enter Email */}
      {stage === "email" && (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="forgot-input"
          />
          <button
            onClick={handleSendResetCode}
            disabled={loading}
            className="forgot-button primary"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </>
      )}

      {/* Step 2: Enter Code */}
      {stage === "code" && (
        <>
          <input
            type="text"
            placeholder="Enter the 6-digit code"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            className="forgot-input"
          />
          <button onClick={handleVerifyCode} className="forgot-button success">
            Verify Code
          </button>
        </>
      )}

      {/* Step 3: Reset Password */}
      {stage === "reset" && (
        <>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="forgot-input"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="forgot-input"
          />
          <button onClick={handleResetPassword} className="forgot-button primary">
            Reset Password
          </button>
        </>
      )}
    </div>
  );
}

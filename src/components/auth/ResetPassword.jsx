import React, { useState } from "react";
import { supabase } from "../../supabase";
import Swal from "sweetalert2";

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

    // Store the code temporarily in Supabase (custom table)
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
  const handleVerifyCode = async () => {
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
    <div
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Forgot Password</h2>

      {/* Step 1: Enter Email */}
      {stage === "email" && (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleSendResetCode}
            disabled={loading}
            style={{
              width: "100%",
              padding: 10,
              border: "none",
              borderRadius: 8,
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
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
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleVerifyCode}
            style={{
              width: "100%",
              padding: 10,
              border: "none",
              borderRadius: 8,
              backgroundColor: "#28a745",
              color: "#fff",
              cursor: "pointer",
            }}
          >
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
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleResetPassword}
            style={{
              width: "100%",
              padding: 10,
              border: "none",
              borderRadius: 8,
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reset Password
          </button>
        </>
      )}
    </div>
  );
}

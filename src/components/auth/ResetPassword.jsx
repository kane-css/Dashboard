import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const navigate = useNavigate();

  // ✅ When the user clicks the email link, Supabase includes a token in the URL.
  // This hook detects it and lets Supabase handle session recovery.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token) {
        supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        setTokenLoaded(true);
      }
    } else {
      setTokenLoaded(true); // still allow page render
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess("Your password has been updated successfully!");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!tokenLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Verifying link...</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-gray-100"
      style={{ padding: "20px" }}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
        style={{ textAlign: "center" }}
      >
        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded p-3 mb-4"
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded p-3 mb-4"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded"
          >
            Update Password
          </button>
        </form>

        <p className="mt-4 text-sm">
          <a
            href="/signin"
            className="text-blue-600 hover:underline"
          >
            Back to Sign In
          </a>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import Swal from "sweetalert2";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const handleAuthStateChange = async () => {
      // Wait a bit for Supabase to process the hash
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Swal.fire({
          title: 'Error',
          text: 'Invalid or expired reset link. Please request a new one.',
          icon: 'error'
        });
        navigate('/forgot-password');
      } else {
        setCheckingSession(false);
      }
    };

    // Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery detected');
        setCheckingSession(false);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('Session established');
        setCheckingSession(false);
      }
    });

    // Start checking after a delay
    timeoutId = setTimeout(handleAuthStateChange, 500);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire("Error", "Passwords do not match!", "error");
      return;
    }

    if (password.length < 6) {
      Swal.fire("Error", "Password must be at least 6 characters long!", "error");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await Swal.fire("Success", "Password has been successfully reset!", "success");
      
      // Sign out after password reset
      await supabase.auth.signOut();
      navigate("/signin");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <form
        onSubmit={handleResetPassword}
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "300px",
          textAlign: "center",
        }}
      >
        <h2>Reset Password</h2>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", margin: "10px 0", boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", margin: "10px 0", boxSizing: "border-box" }}
        />
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px" }}>
          {loading ? "Updating..." : "Confirm"}
        </button>
        <br />
        <button
          type="button"
          onClick={() => navigate("/signin")}
          style={{ marginTop: "10px", width: "100%", padding: "10px" }}
        >
          Back to Sign In
        </button>
      </form>
    </div>
  );
}
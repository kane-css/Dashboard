import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import modifikasiLogo from '../../assets/modifikasi-logo.png';
import '../ownercss/Auth.css';
import { supabase } from '../../supabase'; // Make sure path is correct

// STEP 1: Add the 'onLogin' prop back into the function definition
export default function SignIn({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      return Swal.fire('Log In Failed', authError.message, 'error');
    }

    // 2. Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status, username')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return Swal.fire('Profile Not Found', "Your user profile doesn't exist.", 'error');
    }

    // 3. Check status
    if (profile.status === 'pending') {
      await supabase.auth.signOut();
      return Swal.fire('Account Pending', 'Your account is still awaiting approval.', 'info');
    }
    if (profile.status === 'suspended') {
      await supabase.auth.signOut();
      return Swal.fire('Account Suspended', 'This account is suspended.', 'warning');
    }

    // --- STEP 2: THE CRUCIAL FIX ---
    // After all checks pass, call the onLogin function from App.jsx
    // This tells App.jsx that the user is logged in and what their role is.
    onLogin(profile.role);
    
    // Now the navigation will work because App.jsx has the correct state.
    // The handleLogin in App.jsx also navigates, so this part is technically redundant,
    // but it's okay to keep it for immediate feedback.
    if (profile.role === 'owner') {
      navigate('/dashboard');
    } else {
      navigate('/admin-dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src={modifikasiLogo} alt="Logo" className="auth-logo" />
        <h2 className="auth-title">Sign In</h2>
        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
        <button className="auth-button" onClick={handleLogin}>Login</button>
        <p className="switch-auth">
          Don’t have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/signup')}>
            Sign Up
          </span>
        </p>
      </div>
      <button
        className="toggle-btn"
        onClick={() => document.body.classList.toggle('dark')}
      >
        🌓
      </button>
    </div>
  );
}
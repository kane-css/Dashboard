import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import modifikasiLogo from '../../assets/modifikasi-logo.png';
import '../ownercss/Auth.css';
import { supabase } from '../../supabase';

export default function SignIn({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profile) {
          const redirectPath =
            profile.role === 'owner' ? '/dashboard' : '/admin-dashboard';
          navigate(redirectPath, { replace: true });

          // ✅ Block back button after redirect
          window.history.pushState(null, '', window.location.href);
          window.addEventListener('popstate', () => {
            window.history.pushState(null, '', window.location.href);
          });
        }
      }
    };
    checkSession();
  }, [navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (event) => {
    if (event) event.preventDefault();

    if (!email.trim()) {
      return Swal.fire('Validation Error', 'Email is required.', 'warning');
    }
    if (!validateEmail(email)) {
      return Swal.fire('Validation Error', 'Please enter a valid email.', 'warning');
    }
    if (!password) {
      return Swal.fire('Validation Error', 'Password is required.', 'warning');
    }
    if (password.length < 6) {
      return Swal.fire('Validation Error', 'Password must be at least 6 characters.', 'warning');
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return Swal.fire('Log In Failed', authError.message, 'error');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return Swal.fire('Profile Not Found', "Your user profile doesn't exist.", 'error');
    }

    if (profile.status === 'pending') {
      await supabase.auth.signOut();
      return Swal.fire('Account Pending', 'Your account is still awaiting approval.', 'info');
    }

    if (profile.status === 'suspended') {
      await supabase.auth.signOut();
      return Swal.fire('Account Suspended', 'This account is suspended.', 'warning');
    }

    onLogin(profile.role);

    const redirectPath = profile.role === 'owner' ? '/dashboard' : '/admin-dashboard';
    navigate(redirectPath, { replace: true });

    // ✅ Blocks back button after successful login
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () => {
      window.history.pushState(null, '', window.location.href);
    });
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
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="auth-button">Login</button>
        <p className="switch-auth">
          Don't have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/signup', { replace: true })}>
            Sign Up
          </span>
        </p>
      </form>
      <button
        className="toggle-btn"
        onClick={() => document.body.classList.toggle('dark')}
      >
        🌓
      </button>
    </div>
  );
}

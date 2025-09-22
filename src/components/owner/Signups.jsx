import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import modifikasiLogo from '../../assets/modifikasi-logo.png';
import '../ownercss/Auth.css';
import { supabase } from '../../supabase';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // user already logged in → fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profile) {
          const redirectPath =
            profile.role === 'owner' ? '/dashboard' : '/admin-dashboard';
          navigate(redirectPath, { replace: true });
        }
      }
    };
    checkSession();
  }, [navigate]);

  // Simple email regex for validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignUp = async (event) => {
    if (event) event.preventDefault();

    // Client-side validation
    if (!fullName.trim()) {
      return Swal.fire('Validation Error', 'Please enter your full name.', 'warning');
    }
    if (!email.trim()) {
      return Swal.fire('Validation Error', 'Please enter your email.', 'warning');
    }
    if (!validateEmail(email)) {
      return Swal.fire('Validation Error', 'Please enter a valid email address.', 'warning');
    }
    if (!password) {
      return Swal.fire('Validation Error', 'Please enter your password.', 'warning');
    }
    if (password.length < 6) {
      return Swal.fire('Validation Error', 'Password must be at least 6 characters long.', 'warning');
    }

    try {
      // 1. Create the user in Supabase Authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        return Swal.fire('Sign Up Failed', authError.message, 'error');
      }

      console.log('Sign up successful:', authData);

      // 2. Immediately sign out to wait for approval
      await supabase.auth.signOut();

      // 3. Show success message
      await Swal.fire({
        title: 'Success!',
        text: 'Your account application has been submitted and is awaiting approval.',
        icon: 'info',
        confirmButtonColor: '#000000',
      });

      // 4. Navigate to signin
      navigate('/signin', { replace: true });
    } catch (error) {
      console.error('Unexpected error:', error);
      Swal.fire('Error', 'An unexpected error occurred. Please try again.', 'error');
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
        <button type="submit" className="auth-button">Create Account</button>
        <p className="switch-auth">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/signin')}>Sign In</span>
        </p>
      </form>
    </div>
  );
}

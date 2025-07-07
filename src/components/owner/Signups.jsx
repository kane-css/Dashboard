// src/components/owner/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import modifikasiLogo from '../../assets/modifikasi-logo.png';
import '../ownercss/Auth.css';
import { supabase } from '../../supabase';

export default function SignUp() {
  const [fullName, setFullName] = useState(''); // Added full_name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
  // 1. Create the user in Supabase Authentication
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName, 
      }
    }
  });

  if (authError) {
    return Swal.fire('Sign Up Failed', authError.message, 'error');
  }
  
  // THE FIX IS HERE:
  // Show the success message and WAIT for the user to click "OK".
  Swal.fire({
    title: 'Success!',
    text: 'Your account application has been submitted and is awaiting approval.',
    icon: 'info',
    confirmButtonColor: '#000000', // Optional: Keep your button style consistent
  }).then((result) => {
    // This code runs ONLY AFTER the user closes the alert.
    if (result.isConfirmed) {
      navigate('/signin');
    }
  });
};

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src={modifikasiLogo} alt="Logo" className="auth-logo" />
        <h2 className="auth-title">Sign Up</h2>
        <input
          type="text"
          className="auth-input"
          placeholder="Full Name"
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="auth-button" onClick={handleSignUp}>Create Account</button>
        <p className="switch-auth">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/signin')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}
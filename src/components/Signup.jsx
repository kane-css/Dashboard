import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import modifikasiLogo from '../assets/modifikasi-logo.png';
import './Auth.css';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = () => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
      Swal.fire({
        title: 'Sign Up Failed',
        text: 'Username already exists.',
        icon: 'error',
        confirmButtonColor: '#000000',
      });
      return;
    }

    const newUser = { username, password, status: 'active' };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    Swal.fire({
      title: 'Success',
      text: 'Account created successfully!',
      icon: 'success',
      confirmButtonColor: '#000000',
    });

    navigate('/signin');
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src={modifikasiLogo} alt="Modifikasi Logo" className="auth-logo" />
        <h2 className="auth-title">Sign Up</h2>
        <input
          type="text"
          className="auth-input"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import modifikasiLogo from '../../assets/modifikasi-logo.png';
import '../ownercss/Auth.css';

export default function SignIn({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Admin credentials
    if (username === 'admin' && password === 'adminpass') {
      return Swal.fire({
        title: 'Welcome Admin!',
        icon: 'success',
        confirmButtonColor: '#000000',
      }).then(() => {
        localStorage.setItem(
          'loggedInUser',
          JSON.stringify({ username, role: 'admin' })
        );
        onLogin('admin');
      });
    }

    // Normal users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const found = users.find(u => u.username === username && u.password === password);

    if (!found) {
      return Swal.fire({
        title: 'Log In Failed',
        text: 'Invalid Username or Password',
        icon: 'error',
        confirmButtonColor: '#000000',
      });
    }
    if (found.status === 'suspended') {
      return Swal.fire({
        title: 'Account Suspended',
        text: 'This account is suspended.',
        icon: 'warning',
        confirmButtonColor: '#000000',
      });
    }

    // Normal user login
    Swal.fire({
      title: 'Welcome!',
      text: `Hello, ${found.username}`,
      icon: 'success',
      confirmButtonColor: '#000000',
    }).then(() => {
      localStorage.setItem(
        'loggedInUser',
        JSON.stringify({ ...found, role: 'user' })
      );
      onLogin('user');
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src={modifikasiLogo} alt="Logo" className="auth-logo" />
        <h2 className="auth-title">Sign In</h2>
        <input
          type="text"
          className="auth-input"
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
        <button className="auth-button" onClick={handleLogin}>
          Login
        </button>
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

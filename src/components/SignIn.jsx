import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import modifikasiLogo from '../assets/modifikasi-logo.png';
import './Auth.css';

export default function SignIn({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    document.body.classList.toggle('dark');
  };

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = users.find(
      (user) => user.username === username && user.password === password
    );

    if (!foundUser) {
      Swal.fire({
        title: 'Log In Failed',
        text: 'Invalid Username or Password',
        icon: 'error',
        confirmButtonColor: '#000000',
      });
    } else if (foundUser.status === 'suspended') {
      Swal.fire({
        title: 'Account Suspended',
        text: 'This account is suspended.',
        icon: 'warning',
        confirmButtonColor: '#000000',
      });
    } else {
      Swal.fire({
        title: 'Welcome!',
        text: `Hello, ${foundUser.username}`,
        icon: 'success',
        confirmButtonColor: '#000000',
      }).then(() => {
        localStorage.setItem('loggedInUser', foundUser.username);
        onLogin();
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src={modifikasiLogo} alt="Modifikasi Logo" className="auth-logo" />
        <h2 className="auth-title">Sign In</h2>
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
        <button className="auth-button" onClick={handleLogin}>Login</button>
        <p className="switch-auth">
          Don’t have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/signup')}>Sign Up</span>
        </p>
      </div>

      <button className="toggle-btn" onClick={toggleDarkMode}>🌓</button>
    </div>
  );
}

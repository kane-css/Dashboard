import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem('currentUser'); // set in SignIn.jsx
  return isLoggedIn ? children : <Navigate to="/signin" replace />;
}

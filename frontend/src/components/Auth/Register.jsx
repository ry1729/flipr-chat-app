import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';;
import { toast } from 'react-toastify'; // For toast notifications

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Effect to check if user is already logged in (e.g., by token in localStorage)
  // If so, redirect them to the chat page immediately.
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      navigate('/chats'); // Redirect to chat page if already logged in
    }
  }, [navigate]); // navigate is a dependency, include it in the array

  const submitHandler = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // --- Client-side validation ---
    if (!username || !email || !password || !confirmPassword) {
      toast.error('Please fill all the fields!');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    // --- End Validation ---

    setLoading(true); // Set loading state to true while waiting for API response

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json', // Specify content type for JSON body
        },
      };

      // Make the API call to your backend registration endpoint
      const { data } = await api.post(
        '/auth/register', // This will be proxied to http://localhost:5000/api/auth/register
        { username, email, password }, // Data to send in the request body
        config // Request headers
      );

      toast.success('Registration Successful! Redirecting to chat...'); // Success notification
      localStorage.setItem('userInfo', JSON.stringify(data)); // Store user data (including token) in local storage

      setLoading(false); // Reset loading state
      navigate('/chats'); // Navigate to the chat page after success

    } catch (error) {
      // Handle errors from the API call
      const errorMessage =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      toast.error(errorMessage); // Display error message
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="auth-container">
      <h2>Register Account</h2>
      <form onSubmit={submitHandler}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="login-link">
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default Register;
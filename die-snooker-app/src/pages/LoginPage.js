import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import styles from '../styles/Form.module.css'; // Import CSS module

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const { ensureUserProfile, userProfile, loadingProfile } = useUserProfile();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await login(email, password);
      const profile = await ensureUserProfile(userCredential.user);

      if (profile) {
        if (profile.role === 'TRAINER' || profile.role === 'MENTAL_TRAINER') {
          navigate('/trainer/dashboard');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Failed to log in. Check your email and password.');
      console.error("Login error:", err);
    }
    setLoading(false);
  };

  if (currentUser && loadingProfile) {
    return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading session...</div>;
  }

  if (!loadingProfile && currentUser && userProfile) {
    if (userProfile.role === 'TRAINER' || userProfile.role === 'MENTAL_TRAINER') {
      return <Navigate to="/trainer/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.formContainer}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className={styles.formFooterText}>
        Player or Trainer? Login above.
      </p>
      <p className={styles.formFooterText}>
        New Trainer? <Link to="/trainer/register">Register here</Link>
      </p>
      {/*
      <p className={styles.formFooterText}>
        New Player? <Link to="/player/register">Sign up as Player</Link> (If player self-registration exists)
      </p>
      */}
    </div>
  );
};

export default LoginPage;

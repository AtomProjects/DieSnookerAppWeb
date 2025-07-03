import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Form.module.css'; // Import CSS module

const TrainerRegistrationPage = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    experience: '',
    role: 'TRAINER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerTrainer, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
        setError('Password should be at least 6 characters.');
        return;
    }

    setLoading(true);
    try {
      await registerTrainer(
        formData.email,
        formData.password,
        formData.displayName,
        formData.experience,
        formData.role
      );
      navigate('/trainer/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to register trainer. The email might already be in use.');
      console.error("Trainer registration error:", err);
    }
    setLoading(false);
  };

  if (currentUser) {
    // Ideally, redirect if user is already logged in, e.g., to their dashboard
    // This could be handled more globally by routing configuration.
    // For now, this form will still be usable but it's not ideal UX.
    console.warn("A user is already logged in. Registration form is still accessible.");
    // return <Navigate to="/trainer/dashboard" />; // Or appropriate dashboard
  }

  return (
    <div className={styles.formContainer}>
      <h2>Trainer Registration</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className={styles.errorMessage}>{error}</p>}

        <div className={styles.formGroup}>
          <label htmlFor="displayName">Display Name:</label>
          <input type="text" id="displayName" name="displayName" value={formData.displayName} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password (min. 6 characters):</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="experience">Experience (e.g., Years, Qualifications):</label>
          <textarea id="experience" name="experience" value={formData.experience} onChange={handleChange} rows="3" />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role">Register as:</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} required>
            <option value="TRAINER">Regular Trainer</option>
            <option value="MENTAL_TRAINER">Mental Trainer</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className={styles.formFooterText}>
        Already registered? <Link to="/trainer/login">Login here</Link>
      </p>
    </div>
  );
};

export default TrainerRegistrationPage;

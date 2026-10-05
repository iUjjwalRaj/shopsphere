import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Forgot Password</h1>
      <p className="muted" style={{ margin: '0 0 4px', fontSize: '0.9rem' }}>
        Enter your registered email address and we will send you a link to reset your password.
      </p>
      <input
        type="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <button className="btn full" disabled={loading}>
        {loading ? 'Sending link...' : 'Send Reset Link'}
      </button>
      <p className="muted">
        Remember your password? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}

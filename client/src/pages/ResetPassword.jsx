import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(data.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Reset Password</h1>
      <p className="muted" style={{ margin: '0 0 4px', fontSize: '0.9rem' }}>
        Please enter and confirm your new password.
      </p>

      {!success ? (
        <>
          <input
            type="password"
            required
            minLength={6}
            placeholder="New Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />

          {error && (
            <div>
              <p className="error">{error}</p>
              {error.toLowerCase().includes('token') && (
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  <Link to="/forgot-password">Request a new reset link</Link>
                </p>
              )}
            </div>
          )}

          <button className="btn full" disabled={loading}>
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p className="success" style={{ fontWeight: 600 }}>{success}</p>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Redirecting to login page in a moment...
          </p>
          <Link to="/login" className="btn full" style={{ marginTop: '12px' }}>
            Go to Login
          </Link>
        </div>
      )}

      <p className="muted">
        Back to <Link to="/login">Login</Link>
      </p>
    </form>
  );
}

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, Lock, User, Eye, EyeOff, KeyRound,
  ArrowRight, AlertCircle, ShieldCheck
} from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin({ onSuccess }) {
  const { login, isLoading, authError, setAuthError } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isShake, setIsShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    const res = await login(username, password, remember);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setIsShake(true);
      setTimeout(() => setIsShake(false), 600);
    }
  };

  const handleUseDefaultCreds = () => {
    setUsername('admin');
    setPassword('pulari2026');
    setAuthError(null);
  };

  return (
    <div className="admin-login-wrapper">
      <div className={`admin-login-card glass-card ${isShake ? 'shake-anim' : ''}`}>
        {/* Crest Banner */}
        <div className="login-header">
          <div className="login-crest-wrap">
            <img src="/pulari-logo.png" alt="Pulari Club" className="login-club-logo" />
            <div className="login-shield-badge">
              <Shield size={14} />
            </div>
          </div>
          <h2 className="login-title">Administrator Portal</h2>
          <p className="login-sub">
            Pulari Arts & Sports Club • Tournament Control Center
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="login-error-alert animate-fadeIn">
            <AlertCircle size={17} className="error-icon" />
            <div className="error-text">
              <strong>Access Denied</strong>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="admin-username">Username or Email</label>
            <div className="input-with-icon">
              <User size={16} className="field-icon" />
              <input
                id="admin-username"
                type="text"
                required
                autoFocus
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setAuthError(null); }}
              />
            </div>
          </div>

          <div className="login-form-group">
            <div className="label-with-hint">
              <label htmlFor="admin-password">Password</label>
            </div>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="remember-checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember session</span>
            </label>

            <button
              type="button"
              className="quick-hint-btn"
              onClick={handleUseDefaultCreds}
              title="Click to auto-fill default credentials"
            >
              <KeyRound size={12} />
              <span>Fill default demo login</span>
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={isLoading || !username.trim() || !password}
          >
            {isLoading ? (
              <span className="btn-loading-wrap">
                <span className="login-spinner" />
                <span>Authenticating with Neon DB...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Admin Panel</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Badge Footer */}
        <div className="login-security-footer">
          <ShieldCheck size={14} className="security-icon" />
          <span>PostgreSQL Auth • SHA-256 Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinanceStore } from '../stores/financeStore';
import logoPng from '../assets/PNG Logo.png';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useFinanceStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(false);

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lx-black flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-lx-surface border border-lx-border rounded-[8px] p-8 space-y-8 select-none">
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={logoPng} alt="Luminexis Logo" className="w-[36px] h-[36px] object-contain" />
          <span className="brand-logo text-[18px] font-normal tracking-[0.1em] text-lx-white">
            LUMINEXIS
          </span>
          <div className="h-[1px] bg-white opacity-[0.05] w-24 mt-2" />
        </div>

        {/* Headline */}
        <div className="space-y-1 text-center">
          <h2 className="font-oxanium text-lg font-bold text-lx-white">
            Enter Corporate Vault
          </h2>
          <p className="font-oxanium text-[11px] font-light text-lx-muted uppercase tracking-wider">
            Ledger & Expenses Terminal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/45 border border-red-800 text-red-200 text-[12px] font-oxanium px-4 py-3 rounded-[4px] text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider">
              Corporate Email
            </label>
            <input 
              type="email" 
              required
              disabled={isLoading}
              placeholder="e.g. founder@luminexis.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider">
              Access Token / Password
            </label>
            <input 
              type="password" 
              required
              disabled={isLoading}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full disabled:opacity-50"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full font-oxanium text-[12px] font-semibold text-lx-white bg-lx-green hover:bg-lx-green-mid rounded-[4px] py-3.5 shadow-md transition-colors active:scale-[0.98] mt-6 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? 'Authenticating...' : 'Authenticate Credentials'}
          </button>
        </form>

        {/* Footer Signup Link */}
        <div className="text-center pt-2">
          <p className="font-oxanium text-[12px] text-lx-muted">
            First-time setup?{' '}
            <Link to="/signup" className="text-lx-green-glow hover:underline">
              Create Corporate Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;

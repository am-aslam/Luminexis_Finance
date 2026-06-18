import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFinanceStore } from '../stores/financeStore';
import logoPng from '../assets/PNG Logo.png';

export const Signup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteDetails, setInviteDetails] = useState(null);

  const signup = useFinanceStore((state) => state.signup);
  const verifyInviteToken = useFinanceStore((state) => state.verifyInviteToken);
  const navigate = useNavigate();

  // If token is provided, verify it on load
  useEffect(() => {
    const fetchInviteDetails = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        setError('');
        const details = await verifyInviteToken(token);
        setInviteDetails(details);
        setEmail(details.email); // Pre-fill and lock email
      } catch (err) {
        setError(err.message || 'Invitation link is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInviteDetails();
  }, [token, verifyInviteToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (password.length < 8) {
      setError('Access Token (Password) must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      await signup({
        name,
        email,
        password,
        inviteToken: token || undefined
      });
      setSuccess('Account created successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lx-black flex items-center justify-center p-4">
      {/* Signup Card */}
      <div className="w-full max-w-[440px] bg-lx-surface border border-lx-border rounded-[8px] p-8 space-y-8 select-none">
        
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
            {token ? 'Accept Team Invitation' : 'Register Corporate Account'}
          </h2>
          <p className="font-oxanium text-[11px] font-light text-lx-muted uppercase tracking-wider">
            {inviteDetails ? `Joining as Co-founder` : `Founder Vault Initialization`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/45 border border-red-800 text-red-200 text-[12px] font-oxanium px-4 py-3 rounded-[4px] text-center">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-950/45 border border-green-800 text-green-200 text-[12px] font-oxanium px-4 py-3 rounded-[4px] text-center">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider">
              Full Name
            </label>
            <input 
              type="text" 
              required
              disabled={isLoading}
              placeholder="e.g. Aakesh Agnihotri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider">
              Corporate Email
            </label>
            <input 
              type="email" 
              required
              disabled={isLoading || !!inviteDetails}
              placeholder="e.g. founder@luminexis.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full disabled:opacity-50 disabled:text-lx-muted"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider">
              Access Token / Password (min 8 chars)
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
            {isLoading ? 'Processing...' : (inviteDetails ? 'Join Shared Workspace' : 'Initialize Corporate Account')}
          </button>
        </form>

        {/* Footer Login Link */}
        <div className="text-center pt-2">
          <p className="font-oxanium text-[12px] text-lx-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-lx-green-glow hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Signup;

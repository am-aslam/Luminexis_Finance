import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFinanceStore } from '../stores/financeStore';
import { AlertTriangle, Loader2, RotateCcw, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoPng from '../assets/PNG Logo.png';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'network' | 'auth' | 'generic'
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const login = useFinanceStore((state) => state.login);
  const navigate = useNavigate();

  const classifyError = (errMessage) => {
    const msg = (errMessage || '').toLowerCase();
    if (msg.includes('unable to connect') || msg.includes('offline') || msg.includes('timed out') || msg.includes('temporarily unavailable') || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('unreadable response')) return 'network';
    if (msg.includes('invalid') || msg.includes('unauthorized') || msg.includes('credentials')) return 'auth';
    return 'generic';
  };

  const getErrorDisplay = () => {
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Failed',
          message: error,
        };
      case 'auth':
        return {
          title: 'Authentication Failed',
          message: 'Invalid email or password. Please verify your credentials and try again.',
        };
      default:
        return {
          title: 'Login Error',
          message: error,
        };
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setErrorType('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      setErrorType('generic');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      setErrorType(classifyError(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const errorDisplay = getErrorDisplay();

  return (
    <div className="min-h-screen bg-lx-black flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] bg-lx-green/5 rounded-full blur-3xl pointer-events-none -top-40 -left-40" />
      <div className="absolute w-[500px] h-[500px] bg-lx-green/5 rounded-full blur-3xl pointer-events-none -bottom-40 -right-40" />

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-lx-black/95 z-50 flex flex-col items-center justify-center p-4 select-none"
          >
            <div className="relative flex flex-col items-center max-w-[400px] text-center space-y-6">
              <div className="absolute w-48 h-48 bg-lx-green/10 rounded-full blur-3xl -z-10 animate-pulse" />
              
              <motion.div
                initial={{ scale: 0.8, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 10 }}
              >
                <svg className="w-20 h-20 text-lx-green-glow" viewBox="0 0 52 52">
                  <motion.circle
                    cx="26" cy="26" r="24"
                    stroke="currentColor" strokeWidth="2" fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M16 27 l7 7 l14 -14"
                    stroke="currentColor" strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round" fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <h2 className="font-oxanium text-xl font-bold text-lx-white tracking-wide">
                  Identity Verified
                </h2>
                <p className="font-oxanium text-[13px] text-lx-muted">
                  Entering corporate workspace...
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-lx-surface border border-lx-border rounded-[8px] p-8 space-y-8 select-none relative z-10 shadow-2xl">
        
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

        {/* Polished Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="bg-[#150505] border border-red-800/80 text-red-200 text-[12px] font-oxanium p-4 rounded-[6px] space-y-3 relative overflow-hidden shadow-lg"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-900/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-red-400 uppercase tracking-wider text-[10px]">
                    {errorDisplay.title}
                  </h4>
                  <p className="text-red-200/90 font-light leading-relaxed">
                    {errorDisplay.message}
                  </p>
                </div>
              </div>

              {/* Action buttons based on error type */}
              <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-red-900/30 mt-2">
                {errorType === 'auth' && (
                  <Link
                    to="/signup"
                    className="text-lx-green-glow hover:text-white font-semibold text-[11px] px-2 py-1.5 flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Create New Account
                  </Link>
                )}

                {errorType === 'network' && (
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="bg-red-950/80 hover:bg-red-900/60 border border-red-800/60 text-red-200 hover:text-white font-semibold text-[11px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Connection
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            className="w-full font-oxanium text-[12px] font-semibold text-lx-white bg-lx-green hover:bg-lx-green-mid rounded-[4px] py-3.5 shadow-md transition-colors active:scale-[0.98] mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-lx-white" />
                <span>Authenticating...</span>
              </>
            ) : (
              'Authenticate Credentials'
            )}
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

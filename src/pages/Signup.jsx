import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFinanceStore } from '../stores/financeStore';
import { AlertTriangle, Loader2, RotateCcw, LogIn, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoPng from '../assets/PNG Logo.png';

export const Signup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'founder_exists' | 'network' | 'conflict' | 'validation' | 'generic'
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
        setErrorType('');
        const details = await verifyInviteToken(token);
        setInviteDetails(details);
        setEmail(details.email);
      } catch (err) {
        setError(err.message || 'Invitation link is invalid or has expired.');
        setErrorType('generic');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInviteDetails();
  }, [token, verifyInviteToken]);

  // Classify errors into actionable types
  const classifyError = (errMessage) => {
    const msg = (errMessage || '').toLowerCase();
    if (msg.includes('invitation token') || msg.includes('co-founder')) return 'founder_exists';
    if (msg.includes('already exists') || msg.includes('already registered') || msg.includes('conflict')) return 'conflict';
    if (msg.includes('unable to connect') || msg.includes('offline') || msg.includes('timed out') || msg.includes('temporarily unavailable') || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('unreadable response')) return 'network';
    if (msg.includes('validation')) return 'validation';
    return 'generic';
  };

  // Get a human-friendly error message and title based on the error type
  const getErrorDisplay = () => {
    switch (errorType) {
      case 'founder_exists':
        return {
          title: 'Account Already Exists',
          message: 'A Founder account has already been registered. Sign in with your existing credentials, or reset the database to start fresh.',
        };
      case 'conflict':
        return {
          title: 'Email Already Registered',
          message: 'This corporate email is already associated with an existing account. Please sign in instead.',
        };
      case 'network':
        return {
          title: 'Connection Failed',
          message: error,
        };
      case 'validation':
        return {
          title: 'Validation Error',
          message: error,
        };
      default:
        return {
          title: 'Registration Error',
          message: error,
        };
    }
  };

  const validateForm = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    
    if (!trimmedName) {
      setError('Full Name is required.');
      setErrorType('validation');
      return false;
    }
    
    if (!trimmedEmail) {
      setError('Corporate Email is required.');
      setErrorType('validation');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid corporate email address.');
      setErrorType('validation');
      return false;
    }
    
    if (password.length < 8) {
      setError('Access Token (Password) must be at least 8 characters long.');
      setErrorType('validation');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setErrorType('');
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        inviteToken: token || undefined
      });
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      setErrorType(classifyError(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      setIsLoading(true);
      setShowResetConfirm(false);
      await useFinanceStore.getState().resetDatabase();
      setError('');
      setErrorType('');
      setName('');
      setEmail('');
      setPassword('');
    } catch {
      setError('Failed to reset database. The server may be offline.');
      setErrorType('network');
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
                <svg className="w-24 h-24 text-lx-green-glow" viewBox="0 0 52 52">
                  <motion.circle
                    cx="26" cy="26" r="24"
                    stroke="currentColor" strokeWidth="2" fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M16 27 l7 7 l14 -14"
                    stroke="currentColor" strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round" fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
              >
                <h2 className="font-oxanium text-2xl font-bold text-lx-white tracking-wide">
                  Access Granted
                </h2>
                <p className="font-oxanium text-[11px] font-light text-lx-green-glow uppercase tracking-wider">
                  Founder Vault Initialized
                </p>
                <p className="font-oxanium text-[13px] text-lx-muted max-w-[300px] mx-auto leading-relaxed">
                  Corporate security parameters established. Redirecting to workspace...
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup Card */}
      <div className="w-full max-w-[440px] bg-lx-surface border border-lx-border rounded-[8px] p-8 space-y-8 select-none relative z-10 shadow-2xl">
        
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
            {inviteDetails ? 'Joining as Co-founder' : 'Founder Vault Initialization'}
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
                {/* Founder exists -> Sign In + Reset */}
                {errorType === 'founder_exists' && (
                  <>
                    <Link
                      to="/login"
                      className="bg-lx-green/90 hover:bg-lx-green border border-lx-green/60 text-white font-semibold text-[11px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In Instead
                    </Link>
                    {!showResetConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="text-red-400 hover:text-red-300 font-semibold text-[11px] px-2 py-1.5 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reset & Start Fresh
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResetDatabase}
                        className="bg-red-950/80 hover:bg-red-900/60 border border-red-800/60 text-red-200 hover:text-white font-semibold text-[11px] px-3 py-1.5 rounded transition-all animate-pulse"
                      >
                        Confirm Reset — Erase All Data
                      </button>
                    )}
                  </>
                )}

                {/* Conflict (email taken) -> Sign In */}
                {errorType === 'conflict' && (
                  <Link
                    to="/login"
                    className="bg-lx-green/90 hover:bg-lx-green border border-lx-green/60 text-white font-semibold text-[11px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In Instead
                  </Link>
                )}

                {/* Network errors -> Retry */}
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
            className="w-full font-oxanium text-[12px] font-semibold text-lx-white bg-lx-green hover:bg-lx-green-mid rounded-[4px] py-3.5 shadow-md transition-colors active:scale-[0.98] mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-lx-white" />
                <span>Initializing Corporate Account...</span>
              </>
            ) : (
              inviteDetails ? 'Join Shared Workspace' : 'Initialize Corporate Account'
            )}
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

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Modal } from './components/ui/Modal';
import { useFinanceStore } from './stores/financeStore';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Income } from './pages/Income';
import { Capital } from './pages/Capital';
import { BankLedger } from './pages/BankLedger';
import { Reports } from './pages/Reports';
import { Vendors } from './pages/Vendors';
import { Settings } from './pages/Settings';
import { FounderLedger } from './pages/FounderLedger';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// ─── API Not Configured Screen ────────────────────────────────────────────────
// Shows when VITE_API_URL is missing in Vercel environment variables.
const ApiNotConfigured = () => (
  <div className="min-h-screen bg-lx-black flex flex-col items-center justify-center p-8 gap-6 text-center select-none">
    <div className="text-5xl">⚙️</div>
    <div className="space-y-2">
      <h1 className="font-oxanium text-xl font-bold text-amber-400 uppercase tracking-wider">
        Backend Not Configured
      </h1>
      <p className="font-oxanium text-sm text-lx-muted max-w-md leading-relaxed">
        The API server URL is not set. The application cannot connect to the backend.
      </p>
    </div>
    <div className="bg-[#111] border border-amber-700/60 rounded-lg p-5 max-w-lg text-left space-y-3">
      <p className="font-oxanium text-xs font-semibold text-amber-400 uppercase tracking-wider">
        Fix: Set VITE_API_URL in Vercel
      </p>
      <ol className="font-oxanium text-xs text-lx-muted space-y-1.5 leading-relaxed list-decimal list-inside">
        <li>Go to <span className="text-white">Vercel Dashboard → Your Project → Settings</span></li>
        <li>Click <span className="text-white">Environment Variables</span></li>
        <li>Add: <code className="bg-black text-green-400 px-1.5 py-0.5 rounded text-[11px]">VITE_API_URL</code> = your Render backend URL</li>
        <li>Click <span className="text-white">Redeploy</span></li>
      </ol>
      <p className="font-oxanium text-[11px] text-lx-muted pt-1">
        Example value:{' '}
        <code className="bg-black text-green-400 px-1.5 py-0.5 rounded text-[11px]">
          https://luminexis-api.onrender.com/api/v1
        </code>
      </p>
    </div>
  </div>
);


function App() {

  const {
    isAuthenticated, 
    isInitialized, 
    checkAuth, 
    logout,
    addExpense, 
    updateExpense,
    fetchSummary,
    fetchExpenses,
    fetchIncome,
    fetchCapital,
    fetchLedger,
    fetchVendors,
    fetchCategories,
    fetchInvitations
  } = useFinanceStore();

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const navigate = useNavigate();

  // Validate session on mount
  useEffect(() => {
    checkAuth();

    const handleExpired = () => {
      logout();
    };

    window.addEventListener('auth-expired', handleExpired);
    return () => {
      window.removeEventListener('auth-expired', handleExpired);
    };
  }, [checkAuth, logout]);

  // Fetch all analytical data globally when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary();
      fetchExpenses();
      fetchIncome();
      fetchCapital();
      fetchLedger();
      fetchVendors();
      fetchCategories();
      fetchInvitations();
    }
  }, [isAuthenticated, fetchSummary, fetchExpenses, fetchIncome, fetchCapital, fetchLedger, fetchVendors, fetchCategories, fetchInvitations]);

  const handleSaveExpense = async (expenseData) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, expenseData);
    } else {
      await addExpense(expenseData);
    }
    setModalOpen(false);
    setEditingExpense(null);
    navigate('/expenses');
  };

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleOpenAddIncome = () => {
    navigate('/income');
  };

  // Show setup screen if VITE_API_URL is not configured in production
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    return <ApiNotConfigured />;
  }

  // Wait for checkAuth loading state to prevent flash of login screen
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-lx-black flex flex-col items-center justify-center gap-4 text-lx-white font-oxanium select-none">
        <div className="w-[32px] h-[32px] rounded-full border-2 border-lx-green border-t-transparent animate-spin" />
        <span className="text-[12px] uppercase tracking-wider text-lx-muted">Decrypting Vault...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
      <Shell>
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                onAddExpense={handleOpenAddExpense} 
                onAddIncome={handleOpenAddIncome} 
              />
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <Expenses 
                onAddExpense={handleOpenAddExpense} 
                onEditExpense={handleOpenEditExpense} 
              />
            } 
          />
          <Route path="/income" element={<Income />} />
          <Route path="/capital" element={<Capital />} />
          <Route path="/ledger" element={<BankLedger />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/founder-ledger" element={<FounderLedger />} />
        </Routes>
      </Shell>

      {/* Global Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        expenseToEdit={editingExpense}
        onSave={handleSaveExpense}
      />
    </>
  );
}

export default App;

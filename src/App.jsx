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

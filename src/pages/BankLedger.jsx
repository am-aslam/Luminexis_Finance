import React, { useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Edit, Trash2 } from 'lucide-react';

export const BankLedger = () => {
  const { 
    ledger, 
    getCurrentBalance, 
    addLedgerEntry, 
    updateLedgerEntry, 
    deleteLedgerEntry 
  } = useFinanceStore();

  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleStartEdit = (tx) => {
    setEditingTransaction(tx);
    setDate(tx.date);
    setDescription(tx.description);
    if (tx.debit > 0) {
      setType('debit');
      setAmount(tx.debit.toString());
    } else {
      setType('credit');
      setAmount(tx.credit.toString());
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setType('credit');
    setAmount('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    const parsedAmt = parseFloat(amount) || 0;
    const payload = {
      date,
      description,
      debit: type === 'debit' ? parsedAmt : 0,
      credit: type === 'credit' ? parsedAmt : 0
    };

    if (editingTransaction) {
      await updateLedgerEntry(editingTransaction.id, payload);
    } else {
      await addLedgerEntry(payload);
    }

    handleCancelEdit();
  };

  // Standard ledger presentation - newest transactions first
  const sortedLedger = [...ledger];

  return (
    <div className="space-y-12">
      {/* Header bar (free-floating) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lx-border pb-6">
        <div>
          <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none mb-2">
            Bank Ledger
          </h1>
          <p className="font-oxanium text-[13px] font-light text-lx-muted">
            Inspect transaction history and audit trail logs.
          </p>
        </div>

        {/* Current Balance card - NOT a full card, just label + value */}
        <div className="flex flex-col items-end">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light">
            CURRENT BALANCE
          </span>
          <span className="font-oxanium text-3xl md:text-[36px] font-extrabold text-lx-white mt-1">
            {formatCurrency(getCurrentBalance())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Ledger Log table */}
        <div className="lg:col-span-2 space-y-6">
          <span className="editorial-label block tracking-[0.2em] font-light text-[10px] select-none">
            Ledger Audit Log
          </span>

          <div className="border border-lx-border rounded-[8px] bg-lx-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-lx-border">
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Date</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Description</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Debit (-)</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Credit (+)</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Balance</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLedger.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[12px] font-light text-lx-muted">
                        No ledger entries recorded.
                      </td>
                    </tr>
                  ) : (
                    sortedLedger.map((entry, idx) => (
                      <tr 
                        key={`${entry.id}-${idx}`}
                        className={`lx-row-hover transition-all duration-150 select-none
                          ${idx === 0 ? 'border-t-0' : 'border-t border-lx-border/40'}
                          ${idx % 2 === 0 ? 'bg-lx-black' : 'bg-white/[0.01]'}
                          hover:bg-lx-surface-2
                        `}
                      >
                        <td className="py-4 px-6 text-[13px] text-[#CCCCCC] font-oxanium">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-4 px-6 text-[13px] text-lx-white font-oxanium font-medium">
                          {entry.description}
                        </td>
                        <td className="py-4 px-6 text-[13px] font-semibold text-right text-lx-red font-oxanium">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : ''}
                        </td>
                        <td className="py-4 px-6 text-[13px] font-semibold text-right text-lx-green font-oxanium">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : ''}
                        </td>
                        <td className="py-4 px-6 text-[13px] font-bold text-right text-lx-white font-oxanium">
                          {formatCurrency(entry.balance)}
                        </td>
                        <td className="py-4 px-6 text-[13px] font-oxanium text-center">
                          <div className="inline-flex items-center gap-4">
                            <button 
                              onClick={() => handleStartEdit(entry)}
                              className="text-lx-muted hover:text-lx-white transition-colors p-1"
                              title="Edit Ledger Entry"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this ledger entry?')) {
                                  deleteLedgerEntry(entry.id);
                                }
                              }}
                              className="text-lx-muted hover:text-lx-red transition-colors p-1"
                              title="Delete Ledger Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Log New Ledger Transaction */}
        <div className="space-y-6 bg-lx-surface border border-lx-border rounded-[8px] p-6 h-fit">
          <span className="editorial-label block tracking-[0.2em] font-light text-[10px] select-none">
            {editingTransaction ? 'Edit Transaction' : 'Log Transaction'}
          </span>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Date
              </label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Description
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Manual reconciliation entry"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Transaction Type
              </label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="credit">Credit (+ Inflow)</option>
                <option value="debit">Debit (- Outflow)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Amount (₹)
              </label>
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              {editingTransaction && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 font-oxanium text-[12px] font-semibold text-lx-muted border border-lx-border hover:text-lx-white hover:bg-lx-surface-2 rounded-[4px] py-3 transition-colors active:scale-[0.98]"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 font-oxanium text-[12px] font-semibold text-lx-white bg-lx-green hover:bg-lx-green-mid rounded-[4px] py-3 shadow-md transition-colors active:scale-[0.98]"
              >
                {editingTransaction ? 'Save Transaction' : 'Record Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Edit, Trash2 } from 'lucide-react';

export const Income = () => {
  const { income, addIncome, updateIncome, deleteIncome, getTotalIncome } = useFinanceStore();
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Stripe Settlement');
  const [editingIncome, setEditingIncome] = useState(null);

  const handleStartEdit = (inc) => {
    setEditingIncome(inc);
    setSource(inc.source);
    setDescription(inc.description);
    setAmount(inc.amount.toString());
    setPaymentMethod(inc.paymentMethod);
  };

  const handleCancelEdit = () => {
    setEditingIncome(null);
    setSource('');
    setDescription('');
    setAmount('');
    setPaymentMethod('Stripe Settlement');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source || !amount) return;
    
    const payload = {
      source,
      description,
      amount: parseFloat(amount) || 0,
      paymentMethod,
      date: editingIncome ? editingIncome.date : new Date().toISOString().split('T')[0]
    };

    if (editingIncome) {
      await updateIncome(editingIncome.id, payload);
    } else {
      await addIncome(payload);
    }

    handleCancelEdit();
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lx-border pb-6">
        <div>
          <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none mb-2">
            Gross Revenue
          </h1>
          <p className="font-oxanium text-[13px] font-light text-lx-muted">
            Track client payments and invoice settlements.
          </p>
        </div>

        <div className="flex flex-col items-end">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light">
            TOTAL REVENUE
          </span>
          <span className="font-oxanium text-3xl font-extrabold text-lx-white mt-1">
            {formatCurrency(getTotalIncome())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: List of Income Payments */}
        <div className="lg:col-span-2 space-y-6">
          <span className="editorial-label block tracking-[0.2em] font-light text-[10px] select-none">
            Settlement Log
          </span>
          
          <div className="border border-lx-border rounded-[8px] bg-lx-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-lx-border">
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Date</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Source</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Method</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Amount</th>
                    <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((inc) => (
                    <tr key={inc.id} className="border-b border-lx-border/40 hover:bg-lx-surface-2 transition-colors">
                      <td className="py-4 px-6 text-[13px] text-lx-muted font-oxanium">{formatDate(inc.date)}</td>
                      <td className="py-4 px-6 text-[13px] text-lx-white font-oxanium font-medium">
                        {inc.source} <span className="text-[11px] text-lx-muted font-light">({inc.description})</span>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-lx-muted font-oxanium">{inc.paymentMethod}</td>
                      <td className="py-4 px-6 text-[13px] font-semibold text-right text-lx-green-glow font-oxanium">
                        {formatCurrency(inc.amount)}
                      </td>
                      <td className="py-4 px-6 text-[13px] font-oxanium text-center">
                        <div className="inline-flex items-center gap-4">
                          <button 
                            onClick={() => handleStartEdit(inc)}
                            className="text-lx-muted hover:text-lx-white transition-colors p-1"
                            title="Edit Income"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this income record?')) {
                                deleteIncome(inc.id);
                              }
                            }}
                            className="text-lx-muted hover:text-lx-red transition-colors p-1"
                            title="Delete Income"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Log New Revenue Payment */}
        <div className="space-y-6 bg-lx-surface border border-lx-border rounded-[8px] p-6 h-fit">
          <span className="editorial-label block tracking-[0.2em] font-light text-[10px] select-none">
            {editingIncome ? 'Edit Revenue' : 'Log Revenue'}
          </span>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Source Client
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Acme Corporation"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Description
              </label>
              <input 
                type="text" 
                placeholder="e.g. SaaS payment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
              />
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

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Settlement Channel
              </label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="Stripe Settlement">Stripe Settlement</option>
                <option value="Razorpay Settlement">Razorpay Settlement</option>
                <option value="Direct Wire">Direct Wire</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {editingIncome && (
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
                {editingIncome ? 'Save Settlement' : 'Record Settlement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

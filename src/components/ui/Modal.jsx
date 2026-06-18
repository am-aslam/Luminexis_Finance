import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculateGST } from '../../utils/gstCalculator';

export const Modal = ({ isOpen, onClose, expenseToEdit, onSave }) => {
  if (!isOpen) return null;

  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  
  // Inputs for GST logic
  const [baseAmount, setBaseAmount] = useState('');
  const [gstRate, setGstRate] = useState('18');
  
  // Debounced output fields
  const [gstAmount, setGstAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paidBy, setPaidBy] = useState('Aakesh');
  const [status, setStatus] = useState('Paid');

  // Load editing values if provided
  useEffect(() => {
    if (expenseToEdit) {
      setDate(expenseToEdit.date || '');
      setCategory(expenseToEdit.category || '');
      setVendor(expenseToEdit.vendor || '');
      setDescription(expenseToEdit.description || '');
      setBaseAmount(expenseToEdit.baseAmount?.toString() || '');
      setGstRate(expenseToEdit.gstRate?.toString() || '18');
      setGstAmount(expenseToEdit.gstAmount || 0);
      setTotal(expenseToEdit.total || 0);
      setPaymentMethod(expenseToEdit.paymentMethod || 'Credit Card');
      setPaidBy(expenseToEdit.paidBy || 'Aakesh');
      setStatus(expenseToEdit.status || 'Paid');
    } else {
      // Defaults for new expense
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setCategory('Software');
      setVendor('');
      setDescription('');
      setBaseAmount('');
      setGstRate('18');
      setGstAmount(0);
      setTotal(0);
      setPaymentMethod('Credit Card');
      setPaidBy('Aakesh');
      setStatus('Paid');
    }
  }, [expenseToEdit, isOpen]);

  // GST 100ms Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      const result = calculateGST(baseAmount, gstRate);
      setGstAmount(result.gstAmount);
      setTotal(result.total);
    }, 100);

    return () => clearTimeout(handler);
  }, [baseAmount, gstRate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vendor || !baseAmount) return;

    const expenseData = {
      date,
      category,
      vendor,
      description,
      baseAmount: parseFloat(baseAmount) || 0,
      gstRate: parseFloat(gstRate) || 0,
      gstAmount,
      total,
      paymentMethod,
      paidBy,
      status
    };

    onSave(expenseData);
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      {/* Modal Card */}
      <div 
        className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-lx-surface border-t-2 border-t-lx-green border-x border-b border-lx-border rounded-[8px] flex flex-col relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-lx-border">
          <h3 className="font-oxanium font-semibold text-[18px] text-lx-white">
            {expenseToEdit ? 'Edit Expense' : 'New Expense'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-lx-muted hover:text-lx-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Date (Full Width) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider select-none">
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

          {/* Row 2: Category + Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider select-none">
                Category
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="Software">Software</option>
                <option value="Rent">Rent</option>
                <option value="Operations">Operations</option>
                <option value="Utilities">Utilities</option>
                <option value="Marketing">Marketing</option>
                <option value="Travel">Travel</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider select-none">
                Vendor
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. AWS Cloud"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
              />
            </div>
          </div>

          {/* Row 3: Description (Full Width) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider select-none">
              Description
            </label>
            <input 
              type="text" 
              placeholder="e.g. Server hosting fees"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
            />
          </div>

          {/* Row 4: Base Amount + GST% */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider select-none">
                Base Amount (₹)
              </label>
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="0.00"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] font-light text-lx-green uppercase tracking-wider select-none">
                GST Rate (%)
              </label>
              <select 
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="0">0% (GST Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18% (Standard SaaS)</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          {/* Read-only Live Calculations: GST Amount + Total */}
          <div className="grid grid-cols-2 gap-4 bg-lx-surface-2/40 p-3.5 rounded-[6px] border border-lx-border">
            <div className="flex flex-col">
              <span className="font-oxanium text-[10px] text-lx-muted uppercase tracking-wider select-none">
                GST Amount
              </span>
              <span className="font-oxanium text-[14px] font-semibold text-lx-green-glow mt-1 select-all">
                ₹{gstAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-oxanium text-[10px] text-lx-muted uppercase tracking-wider select-none">
                Total Estimate
              </span>
              <span className="font-oxanium text-[15px] font-bold text-lx-green-glow mt-1 select-all">
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Row 5: Payment Method + Paid By + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[10px] font-light text-lx-green uppercase tracking-wider select-none">
                Method
              </label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-2 py-2 text-[12px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[10px] font-light text-lx-green uppercase tracking-wider select-none">
                Paid By
              </label>
              <select 
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-2 py-2 text-[12px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="Aakesh">Aakesh</option>
                <option value="Co-founder">Co-founder</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[10px] font-light text-lx-green uppercase tracking-wider select-none">
                Status
              </label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-2 py-2 text-[12px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-lx-border">
            <button 
              type="button"
              onClick={onClose}
              className="font-oxanium text-[12px] font-medium text-lx-muted hover:text-lx-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="font-oxanium text-[12px] font-semibold text-lx-white bg-lx-green hover:bg-lx-green-mid rounded-[6px] px-5 py-2.5 shadow-md transition-colors active:scale-[0.98]"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

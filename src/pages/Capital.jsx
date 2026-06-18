import React, { useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export const Capital = () => {
  const { capital, addCapital, getTotalCapital } = useFinanceStore();
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!source || !amount) return;

    addCapital({
      source,
      description,
      amount: parseFloat(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Completed'
    });

    setSource('');
    setDescription('');
    setAmount('');
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lx-border pb-6">
        <div>
          <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none mb-2">
            Capital Injections
          </h1>
          <p className="font-oxanium text-[13px] font-light text-lx-muted">
            Manage equity funding, founder loans, and grant allocations.
          </p>
        </div>

        <div className="flex flex-col items-end">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light">
            TOTAL CAPITAL
          </span>
          <span className="font-oxanium text-3xl font-extrabold text-lx-white mt-1">
            {formatCurrency(getTotalCapital())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: List of Capital */}
        <div className="lg:col-span-2 space-y-6">
          <span className="editorial-label block tracking-[0.2em] font-light text-[10px] select-none">
            Inflow Records
          </span>

          <div className="border border-lx-border rounded-[8px] bg-lx-surface overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-lx-border">
                  <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Date</th>
                  <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Source Type</th>
                  <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Detail Description</th>
                  <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Inflow</th>
                </tr>
              </thead>
              <tbody>
                {capital.map((item) => (
                  <tr key={item.id} className="border-b border-lx-border/40 hover:bg-lx-surface-2 transition-colors">
                    <td className="py-4 px-6 text-[13px] text-lx-muted font-oxanium">{formatDate(item.date)}</td>
                    <td className="py-4 px-6 text-[13px] text-lx-white font-oxanium font-medium">{item.source}</td>
                    <td className="py-4 px-6 text-[13px] text-lx-muted font-oxanium">{item.description}</td>
                    <td className="py-4 px-6 text-[13px] font-semibold text-right text-lx-white font-oxanium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Input Capital */}
        <div className="space-y-6 bg-lx-surface border border-lx-border rounded-[8px] p-6 h-fit">
          <span className="editorial-label block tracking-[0.2em] font-light text-[10px] select-none">
            Inject Capital
          </span>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Capital Source
              </label>
              <select 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-2.5 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full cursor-pointer"
              >
                <option value="">Select source...</option>
                <option value="Founder Equity">Founder Equity</option>
                <option value="Angel Investment">Angel Investment</option>
                <option value="VC Safe Round">VC SAFE Round</option>
                <option value="Government Grant">Government Grant</option>
                <option value="Founder Loan">Founder Loan</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-oxanium text-[11px] text-lx-green uppercase tracking-wider select-none">
                Description
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Q3 Equity Share Premium"
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

            <button 
              type="submit"
              className="w-full font-oxanium text-[12px] font-semibold text-lx-white bg-lx-green hover:bg-lx-green-mid rounded-[4px] py-3 shadow-md transition-colors active:scale-[0.98] mt-2"
            >
              Deposit Capital
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

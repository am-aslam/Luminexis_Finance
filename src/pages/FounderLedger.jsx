import React from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';

export const FounderLedger = () => {
  const { expenses, capital } = useFinanceStore();

  // Compute expenses paid by founder
  const founderExpenses = expenses.reduce((acc, exp) => {
    acc[exp.paidBy] = (acc[exp.paidBy] || 0) + exp.total;
    return acc;
  }, {});

  // Capital per founder
  const founderCapital = capital.reduce((acc, cap) => {
    const owner = cap.source.includes('Founder') ? 'Aakesh' : 'Equity Fund';
    acc[owner] = (acc[owner] || 0) + cap.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-lx-border pb-6">
        <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none mb-2">
          Founder Capital Accounts
        </h1>
        <p className="font-oxanium text-[13px] font-light text-lx-muted">
          Review individual capital draws, equity percentages, and out-of-pocket settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Capital Account summary */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 space-y-6">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light block">
            Equity Accounts
          </span>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-lx-border/50">
              <span className="text-[13px] text-lx-white font-medium">Aakesh Agnihotri (Common Equity)</span>
              <span className="text-[14px] font-bold text-lx-white">{formatCurrency(founderCapital['Aakesh'] || 5000.00)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[13px] text-lx-white font-medium">Unallocated Pools (Option Pool)</span>
              <span className="text-[14px] font-bold text-lx-muted">{formatCurrency(0.00)}</span>
            </div>
          </div>
        </div>

        {/* Out of pocket payments summary */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 space-y-6">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light block">
            Out of Pocket Founder Settlements
          </span>

          <div className="space-y-4">
            {Object.entries(founderExpenses).map(([founder, amount]) => (
              <div key={founder} className="flex justify-between items-center py-2 border-b border-lx-border/50">
                <span className="text-[13px] text-lx-white font-medium">{founder}</span>
                <span className="text-[14px] font-bold text-lx-white">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

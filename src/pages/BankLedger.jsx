import React from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export const BankLedger = () => {
  const { ledger, getCurrentBalance } = useFinanceStore();

  // Reverse list to show newest transactions first, as standard ledger presentation
  const sortedLedger = [...ledger].reverse();

  return (
    <div className="space-y-8">
      {/* Header bar (free-floating) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none">
            Bank Ledger
          </h1>
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

      {/* Table - Same design system as Expense Log */}
      <div className="border border-lx-border rounded-[8px] bg-lx-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-lx-border">
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Date</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Description</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Debit (-)</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Credit (+)</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right pr-8">Balance</th>
              </tr>
            </thead>
            <tbody>
              {sortedLedger.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[12px] font-light text-lx-muted">
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
                      {entry.type === 'debit' ? formatCurrency(entry.amount) : ''}
                    </td>
                    <td className="py-4 px-6 text-[13px] font-semibold text-right text-lx-green font-oxanium">
                      {entry.type === 'credit' ? formatCurrency(entry.amount) : ''}
                    </td>
                    <td className="py-4 px-6 text-[13px] font-bold text-right text-lx-white font-oxanium pr-8">
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

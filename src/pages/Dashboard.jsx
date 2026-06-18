import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateShort } from '../utils/formatDate';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const Dashboard = ({ onAddExpense, onAddIncome }) => {
  const { 
    ledger, 
    expenses, 
    getTotalCapital, 
    getTotalExpenses, 
    getCurrentBalance, 
    getNetBurn 
  } = useFinanceStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to trigger mount animations
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Compute category spending data
  const totalSpend = getTotalExpenses();
  const categoryMap = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.total;
    return acc;
  }, {});

  const categoriesData = Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalSpend > 0 ? (value / totalSpend) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);

  // Get last 6 ledger entries (most recent first)
  const recentActivities = [...ledger]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Top section - free-floating on black */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-oxanium text-sm font-light text-lx-muted uppercase tracking-[0.2em] mb-1">
            Good morning, Aakesh
          </h2>
          <h1 className="font-oxanium text-3xl md:text-[36px] font-extrabold text-lx-white tracking-tight leading-none">
            Financial Overview
          </h1>
        </div>
        
        {/* CTAs */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onAddExpense}
            className="font-oxanium text-[12px] font-medium text-lx-green border border-lx-green rounded-[4px] px-4 py-2 hover:bg-lx-green hover:text-white transition-all duration-150 ease-out active:scale-[0.98]"
          >
            Add Expense +
          </button>
          <button 
            onClick={onAddIncome}
            className="font-oxanium text-[12px] font-medium text-lx-green border border-lx-green rounded-[4px] px-4 py-2 hover:bg-lx-green hover:text-white transition-all duration-150 ease-out active:scale-[0.98]"
          >
            Add Income +
          </button>
        </div>
      </div>

      {/* Stat row - 4 asymmetric metric tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
        {/* Total Capital - Column width = 2fr, taller */}
        <div className="md:col-span-1 min-h-[160px] bg-lx-surface border-l-2 border-l-lx-green border border-lx-border rounded-[8px] p-6 flex flex-col justify-between hover:border-lx-green/45 transition-colors">
          <div>
            <span className="editorial-label text-lx-green block mb-2 font-light tracking-[0.15em] text-[10px]">
              Total Capital
            </span>
            <div className="font-oxanium text-4xl lg:text-[48px] font-extrabold text-lx-white tracking-tight leading-none">
              <AnimatedNumber value={getTotalCapital()} formatter={formatCurrency} />
            </div>
          </div>
          <span className="font-oxanium text-[11px] font-light text-lx-muted mt-4">
            as of today
          </span>
        </div>

        {/* Total Expenses - Column width = 1fr */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 flex flex-col justify-between hover:border-lx-border/80 transition-colors">
          <div>
            <span className="editorial-label text-lx-green block mb-2 font-light tracking-[0.15em] text-[10px]">
              Total Expenses
            </span>
            <div className="font-oxanium text-3xl lg:text-[40px] font-extrabold text-lx-white tracking-tight leading-none">
              <AnimatedNumber value={getTotalExpenses()} formatter={formatCurrency} />
            </div>
          </div>
          <span className="font-oxanium text-[11px] font-light text-lx-muted mt-4">
            across 14 categories
          </span>
        </div>

        {/* Net Burn - Column width = 1fr */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 flex flex-col justify-between hover:border-lx-border/80 transition-colors">
          <div>
            <span className="editorial-label text-lx-green block mb-2 font-light tracking-[0.15em] text-[10px]">
              Net Burn
            </span>
            <div className={`font-oxanium text-3xl lg:text-[40px] font-extrabold tracking-tight leading-none ${getNetBurn() < 0 ? 'text-lx-red' : 'text-lx-green-glow'}`}>
              <AnimatedNumber value={getNetBurn()} formatter={formatCurrency} />
            </div>
          </div>
          <span className="font-oxanium text-[11px] font-light text-lx-muted mt-4">
            monthly net flow
          </span>
        </div>

        {/* Current Balance - Column width = 1.5fr */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 flex flex-col justify-between hover:border-lx-border/80 transition-colors">
          <div>
            <span className="editorial-label text-lx-green block mb-2 font-light tracking-[0.15em] text-[10px]">
              Current Balance
            </span>
            <div className="font-oxanium text-3xl lg:text-[44px] font-extrabold text-lx-white tracking-tight leading-none">
              <AnimatedNumber value={getCurrentBalance()} formatter={formatCurrency} />
            </div>
          </div>
          <span className="font-oxanium text-[11px] font-light text-lx-muted mt-4">
            liquid bank balance
          </span>
        </div>
      </div>

      {/* Two column layout [2fr 1fr] */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Spending by Category */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-lx-border pb-4">
            <span className="editorial-label block tracking-[0.2em] font-light text-[10px]">
              Spending by Category
            </span>
          </div>

          <div className="space-y-5">
            {categoriesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-lx-muted">
                <svg className="w-12 h-12 stroke-[1] text-lx-muted/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-[12px] font-light">Nothing here yet. Add your first expense ↗</span>
              </div>
            ) : (
              categoriesData.map((category) => (
                <div key={category.name} className="flex items-center justify-between gap-4">
                  {/* Category Label */}
                  <span className="w-[100px] text-[12px] text-lx-muted font-medium font-oxanium tracking-wide truncate">
                    {category.name}
                  </span>

                  {/* Horizontal Bar Track */}
                  <div className="flex-1 h-[6px] bg-lx-surface-2 rounded-full overflow-hidden relative">
                    <div 
                      style={{ width: mounted ? `${category.percentage}%` : '0%' }}
                      className="h-full bg-lx-green rounded-full transition-all duration-[600ms] ease-out"
                    />
                  </div>

                  {/* Percentage Value */}
                  <span className="w-[80px] text-right text-[12px] font-semibold text-lx-white font-oxanium">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Transactions */}
        <div className="space-y-6">
          <div className="border-b border-lx-border pb-4">
            <span className="editorial-label block tracking-[0.2em] font-light text-[10px]">
              Recent Activity
            </span>
          </div>

          <div className="flex flex-col">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-lx-muted text-[12px] font-light">
                No activity reported yet.
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="lx-row-hover flex items-center justify-between py-3 border-b border-lx-border cursor-default pl-2"
                >
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="font-oxanium text-[11px] font-light text-lx-muted">
                      {formatDateShort(activity.date)}
                    </span>
                    <span className="font-oxanium text-[13px] font-normal text-lx-white truncate max-w-[160px] md:max-w-xs">
                      {activity.description}
                    </span>
                  </div>

                  <span className={`font-oxanium text-[13px] font-semibold ${activity.type === 'credit' ? 'text-lx-green-glow' : 'text-lx-red'}`}>
                    {activity.type === 'credit' ? '+' : '-'}{formatCurrency(activity.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

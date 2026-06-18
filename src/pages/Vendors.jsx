import React from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';

export const Vendors = () => {
  const { expenses } = useFinanceStore();

  // Compute vendor aggregates
  const vendorMap = expenses.reduce((acc, exp) => {
    if (!acc[exp.vendor]) {
      acc[exp.vendor] = {
        name: exp.vendor,
        count: 0,
        total: 0,
        category: exp.category
      };
    }
    acc[exp.vendor].count += 1;
    acc[exp.vendor].total += exp.total;
    return acc;
  }, {});

  const vendorsList = Object.values(vendorMap).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-lx-border pb-6 select-none">
        <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none mb-2">
          Vendors Directory
        </h1>
        <p className="font-oxanium text-[13px] font-light text-lx-muted">
          Analyze procurement volumes and vendor concentration risk.
        </p>
      </div>

      {/* Grid of vendors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vendorsList.map((vendor) => (
          <div 
            key={vendor.name} 
            className="bg-lx-surface border border-lx-border hover:border-lx-green/45 rounded-[8px] p-6 flex flex-col justify-between transition-all duration-150 group"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="editorial-label text-lx-green text-[9px] tracking-widest font-light">
                  {vendor.category.toUpperCase()}
                </span>
                <span className="font-oxanium text-[11px] font-medium text-lx-muted px-2 py-0.5 bg-lx-surface-2 rounded-full">
                  {vendor.count} trx
                </span>
              </div>
              
              <h3 className="font-oxanium text-lg font-semibold text-lx-white group-hover:text-lx-green-glow transition-colors truncate">
                {vendor.name}
              </h3>
            </div>

            <div className="mt-8 pt-4 border-t border-lx-border/50 flex items-end justify-between">
              <span className="font-oxanium text-[11px] font-light text-lx-muted">
                Total Expenditure
              </span>
              <span className="font-oxanium text-xl font-bold text-lx-white">
                {formatCurrency(vendor.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

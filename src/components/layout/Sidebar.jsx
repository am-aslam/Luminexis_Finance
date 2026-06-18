import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingUp, 
  Wallet, 
  Layers, 
  FileText, 
  Users, 
  LogOut,
  X,
  Settings as SettingsIcon 
} from 'lucide-react';
import logoPng from '../../assets/PNG Logo.png';
import { useFinanceStore } from '../../stores/financeStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/income', label: 'Income', icon: TrendingUp },
  { path: '/capital', label: 'Capital', icon: Wallet },
  { path: '/ledger', label: 'Bank Ledger', icon: Layers },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/vendors', label: 'Vendors', icon: Users },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const user = useFinanceStore(state => state.user);
  const logout = useFinanceStore(state => state.logout);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AA';

  const formatRole = (role) => {
    if (role === 'FOUNDER') return 'Founder';
    if (role === 'CO_FOUNDER') return 'Co-founder';
    if (role === 'ADMIN') return 'Admin';
    return role;
  };

  return (
    <aside className={`
      fixed md:static inset-y-0 left-0 w-[220px] h-screen bg-lx-green-dark border-r border-lx-border flex flex-col justify-between select-none shrink-0 z-50 transition-transform duration-200 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Top Logo Section */}
      <div className="flex flex-col">
        <div className="pt-[32px] pb-[16px] px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logo Mark: Custom PNG Logo */}
            <img src={logoPng} alt="Luminexis Logo" className="w-[24px] h-[24px] object-contain" />
            <span className="brand-logo text-[15px] font-normal tracking-[0.05em] text-lx-white select-none">
              LUMINEXIS
            </span>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="md:hidden text-lx-muted hover:text-lx-white transition-colors p-1"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Thin divider */}
        <div className="h-[1px] bg-white opacity-[0.07] mx-6 mb-6" />

        {/* Navigation Section */}
        <nav className="flex flex-col gap-[2px]">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={{ animationDelay: `${index * 30}ms` }}
                className={({ isActive }) => `
                  flex items-center gap-3 py-[10px] px-[24px] text-[13px] font-medium tracking-[0.02em]
                  border-l-2 transition-all duration-150 ease-out animate-slide-up opacity-0
                  ${isActive 
                    ? 'border-lx-green text-lx-white' 
                    : 'border-transparent text-lx-muted hover:text-lx-white hover:pl-[28px]'
                  }
                `}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Section */}
      <div className="p-6 border-t border-lx-border bg-[#022e18] flex items-center justify-between select-none">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Avatar Initials Circle */}
          <div className="w-[28px] h-[28px] rounded-full bg-lx-green flex items-center justify-center text-lx-white font-oxanium text-[11px] font-bold tracking-wider shrink-0 select-none">
            {initials}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[12px] font-semibold text-lx-white truncate leading-tight">
              {user?.name || 'Aakesh'}
            </span>
            <span className="text-[9px] uppercase tracking-[0.1em] text-lx-green-glow leading-none mt-[2px] font-medium">
              {formatRole(user?.role) || 'Founder'}
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          title="Sign Out"
          className="text-lx-muted hover:text-red-400 transition-colors p-1"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};


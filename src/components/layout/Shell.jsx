import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import logoPng from '../../assets/PNG Logo.png';

export const Shell = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden bg-lx-black text-lx-white select-none">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Responsive Left Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Content wrapper with mobile top header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar for Mobile (hidden on desktop) */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-lx-surface border-b border-lx-border z-30 shrink-0">
          <div className="flex items-center gap-3">
            <img src={logoPng} alt="Luminexis Logo" className="w-[20px] h-[20px] object-contain" />
            <span className="brand-logo text-[13px] font-normal tracking-[0.05em] text-lx-white">
              LUMINEXIS
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-lx-muted hover:text-lx-white transition-colors p-1"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-lx-black px-6 py-8 md:pl-[40px] md:pt-[32px] md:pr-[32px] md:pb-[40px] relative">
          {children}
        </main>
      </div>
    </div>
  );
};


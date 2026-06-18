import React from 'react';
import { Sidebar } from './Sidebar';

export const Shell = ({ children }) => {
  return (
    <div className="flex w-screen h-screen overflow-hidden bg-lx-black text-lx-white select-none">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-lx-black pl-[40px] pt-[32px] pr-[32px] pb-[40px] relative">
        {children}
      </main>
    </div>
  );
};

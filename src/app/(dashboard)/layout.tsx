'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { clsx } from 'clsx';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main
        className={clsx(
          'min-h-screen transition-all duration-200',
          sidebarCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'
        )}
      >
        {/* Mobile menu trigger */}
        <div className="lg:hidden fixed top-0 left-0 z-30 p-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}

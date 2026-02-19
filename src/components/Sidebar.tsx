'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  GitBranch,
  Wallet,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/facturation', label: 'Facturation', icon: Receipt },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/charges', label: 'Charges', icon: Wallet },
  { href: '/calendly', label: 'Calendrier', icon: Calendar },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-200',
          'bg-[#0C0C14] border-r border-white/[0.06]',
          collapsed ? 'w-[60px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 px-5',
          collapsed ? 'justify-center px-0' : 'justify-between'
        )}>
          <Link href="/" className="flex items-center gap-3 min-w-0">
            {collapsed ? (
              <div className="w-[34px] h-[34px] rounded-xl bg-[#5e9eff]/20 flex items-center justify-center">
                <span className="text-[13px] font-bold text-[#5e9eff]">O</span>
              </div>
            ) : (
              <>
                <div className="w-[34px] h-[34px] rounded-xl bg-[#5e9eff]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-[14px] font-bold tracking-tight">
                    <span className="text-white">OPEX</span>
                    <span className="text-[#5e9eff]">IA</span>
                  </span>
                  <p className="text-[9px] text-white/30 font-medium tracking-[0.5px] uppercase">Business Manager</p>
                </div>
              </>
            )}
          </Link>

          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={clsx(
                  'flex items-center gap-3 px-[14px] py-[9px] rounded-xl text-[13px] font-medium transition-colors duration-150',
                  active
                    ? 'bg-white/[0.08] text-[#F5F5F7]'
                    : 'text-white/[0.55] hover:text-white/80 hover:bg-white/[0.04]',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/[0.06] p-3 space-y-1">
          <Link
            href="/parametres"
            onClick={onMobileClose}
            className={clsx(
              'flex items-center gap-3 px-[14px] py-[9px] rounded-xl text-[13px] font-medium transition-colors duration-150',
              isActive('/parametres')
                ? 'bg-white/[0.08] text-[#F5F5F7]'
                : 'text-white/[0.55] hover:text-white/80 hover:bg-white/[0.04]',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Paramètres' : undefined}
          >
            <Settings size={18} className="flex-shrink-0" />
            {!collapsed && <span>Paramètres</span>}
          </Link>

          <button
            onClick={onToggle}
            className="hidden lg:flex items-center gap-3 w-full px-[14px] py-[9px] rounded-xl text-[13px] text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors duration-150"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Réduire</span>}
          </button>

          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-3 w-full px-[14px] py-[9px] rounded-xl text-[13px] text-white/25 hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.06)] transition-colors duration-150',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

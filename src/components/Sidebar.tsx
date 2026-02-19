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
          'bg-[#050505] border-r border-white/[0.06]',
          collapsed ? 'w-[60px]' : 'w-[220px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-14 border-b border-white/[0.06]',
          collapsed ? 'justify-center' : 'justify-between px-4'
        )}>
          <Link href="/" className="flex items-center min-w-0">
            {collapsed ? (
              <span className="text-[17px] font-bold tracking-tight text-white/80">O</span>
            ) : (
              <span className="text-[17px] font-semibold tracking-tight">
                <span className="text-white/80">Opex</span>
                <span className="text-[#a78bfa]">IA</span>
              </span>
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
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={clsx(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150',
                  active
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/[0.06] p-2 space-y-0.5">
          <Link
            href="/parametres"
            onClick={onMobileClose}
            className={clsx(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150',
              isActive('/parametres')
                ? 'bg-white/[0.06] text-white'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Paramètres' : undefined}
          >
            <Settings size={16} className="flex-shrink-0" />
            {!collapsed && <span>Paramètres</span>}
          </Link>

          <button
            onClick={onToggle}
            className="hidden lg:flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-colors duration-150"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Réduire</span>}
          </button>

          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] text-white/25 hover:text-[#f87171] hover:bg-[rgba(248,113,113,0.06)] transition-colors duration-150',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

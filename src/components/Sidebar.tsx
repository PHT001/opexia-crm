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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-sidebar z-50 flex flex-col transition-all duration-300',
          'border-r border-white/5',
          collapsed ? 'w-[68px]' : 'w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center border-b border-white/5',
          collapsed ? 'justify-center h-16' : 'justify-between h-16 px-4'
        )}>
          <Link href="/" className="flex items-center min-w-0">
            {collapsed ? (
              <span className="text-[20px] font-bold tracking-tight">
                <span className="text-white">O</span>
                <span className="bg-gradient-to-r from-[#2997FF] via-[#6366F1] to-[#818CF8] bg-clip-text text-transparent">IA</span>
              </span>
            ) : (
              <span className="text-[22px] font-bold tracking-tight">
                <span className="text-white">Opex</span>
                <span className="bg-gradient-to-r from-[#2997FF] via-[#6366F1] to-[#818CF8] bg-clip-text text-transparent">IA</span>
              </span>
            )}
          </Link>

          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                  active
                    ? 'active-glow text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className={clsx('flex-shrink-0', active && 'text-secondary')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-2 space-y-0.5">
          {/* Param\u00e8tres */}
          <Link
            href="/parametres"
            onClick={onMobileClose}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
              isActive('/parametres')
                ? 'active-glow text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Param\u00e8tres' : undefined}
          >
            <Settings size={18} className={clsx('flex-shrink-0', isActive('/parametres') && 'text-secondary')} />
            {!collapsed && <span>Param&egrave;tres</span>}
          </Link>

          {/* Toggle collapse */}
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-150"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>R&eacute;duire</span>}
          </button>

          {/* D\u00e9connexion */}
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>D&eacute;connexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

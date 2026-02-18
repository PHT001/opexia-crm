'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Receipt,
  GitBranch,
  FolderKanban,
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
  { href: '/projets', label: 'Projets', icon: FolderKanban },
  { href: '/calendly', label: 'Calendrier', icon: Calendar },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-sidebar border-r border-border z-50 flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 border-b border-border px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <Image
              src="/logo.png"
              alt="OpexIA"
              width={36}
              height={36}
              className="rounded-lg flex-shrink-0"
            />
            {!collapsed && (
              <span className="text-lg font-bold gradient-text truncate">
                OpexIA CRM
              </span>
            )}
          </Link>

          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-lg hover:bg-card text-muted hover:text-foreground"
          >
            <X size={20} />
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted hover:text-foreground hover:bg-sidebar-hover',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-2">
          {/* Collapse toggle - desktop only */}
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted hover:text-foreground hover:bg-sidebar-hover transition-all duration-200"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span>Réduire</span>}
          </button>

          <button
            className={clsx(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

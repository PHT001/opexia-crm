'use client';

import { Menu, Search, Bell, Plus } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

export default function Header({ onMenuClick, title, subtitle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-card text-muted hover:text-foreground transition-colors"
          >
            <Menu size={20} />
          </button>

          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 animate-scale-in">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { setSearchOpen(false); setSearchQuery(''); }}
                  autoFocus
                  className="w-64 px-4 py-2 rounded-xl bg-card border border-border-light text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-xl hover:bg-card text-muted hover:text-foreground transition-colors"
              >
                <Search size={20} />
              </button>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-card text-muted hover:text-foreground transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* Quick add */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
            <Plus size={16} />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>
      </div>
    </header>
  );
}

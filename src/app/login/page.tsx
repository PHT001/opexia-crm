'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Mot de passe incorrect');
      }
    } catch {
      setError('Erreur de connexion');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative">
      <div className="w-full max-w-[360px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-4">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white/80">O</span>
              <span className="text-[#a78bfa]">IA</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white/90">OpexIA CRM</h1>
          <p className="text-xs text-white/30 mt-1">Accès sécurisé</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[rgba(108,92,231,0.06)] border border-[rgba(108,92,231,0.1)]">
            <Lock size={14} className="text-[#a78bfa] flex-shrink-0" />
            <p className="text-[11px] text-white/40">
              Entrez votre mot de passe pour accéder au CRM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5 font-medium">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Entrez votre mot de passe"
                  autoFocus
                  className="w-full px-3 py-2.5 pr-9 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm placeholder:text-white/15 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.12)] text-[#f87171] text-xs">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6df0] text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/15 mt-6">
          OpexIA — Agence d&apos;automatisation IA
        </p>
      </div>
    </div>
  );
}

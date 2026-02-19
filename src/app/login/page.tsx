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
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[rgba(124,92,252,0.06)] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[rgba(91,138,245,0.04)] rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#12121e] border border-white/[0.06] mb-4 shadow-lg shadow-[rgba(124,92,252,0.08)]">
            <span className="text-3xl font-bold tracking-tight">
              <span className="text-white/90">O</span>
              <span className="bg-gradient-to-r from-[#7c5cfc] to-[#5b8af5] bg-clip-text text-transparent">IA</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">OpexIA CRM</h1>
          <p className="text-sm text-[#50506b] mt-1">Acc&egrave;s s&eacute;curis&eacute;</p>
        </div>

        {/* Login Card */}
        <div className="relative bg-[#12121e] border border-white/[0.06] rounded-2xl p-6 space-y-5 shadow-2xl">
          {/* Top shine */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(124,92,252,0.3)] to-transparent rounded-t-2xl" />

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(124,92,252,0.06)] border border-[rgba(124,92,252,0.12)]">
            <Lock size={18} className="text-[#7c5cfc] flex-shrink-0" />
            <p className="text-xs text-[#50506b]">
              Entrez votre mot de passe pour acc&eacute;der au CRM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#50506b] mb-1.5 font-medium">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Entrez votre mot de passe"
                  autoFocus
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#e2e2ef] text-sm placeholder:text-white/15 focus:outline-none focus:border-[rgba(124,92,252,0.45)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/65 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7c5cfc] hover:bg-[#8e72ff] text-white text-sm font-medium transition-all disabled:opacity-50 btn-glow"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/15 mt-6">
          OpexIA &mdash; Agence d&apos;automatisation IA
        </p>
      </div>
    </div>
  );
}

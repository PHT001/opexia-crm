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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow orbs — Apple style subtle */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[rgba(10,132,255,0.04)] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[rgba(94,92,230,0.03)] rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-[rgba(255,255,255,0.04)] backdrop-blur-2xl border border-white/[0.08] mb-4 shadow-lg">
            <span className="text-3xl font-bold tracking-tight">
              <span className="text-white/90">O</span>
              <span className="bg-gradient-to-r from-[#0a84ff] to-[#5e5ce6] bg-clip-text text-transparent">IA</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#f5f5f7]">OpexIA CRM</h1>
          <p className="text-sm text-[#636366] mt-1">Acc&egrave;s s&eacute;curis&eacute;</p>
        </div>

        {/* Login Card — Apple glass */}
        <div className="relative bg-[rgba(255,255,255,0.03)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-2xl">
          {/* Subtle top shine */}
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent rounded-t-2xl" />

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(10,132,255,0.06)] border border-[rgba(10,132,255,0.12)]">
            <Lock size={18} className="text-[#0a84ff] flex-shrink-0" />
            <p className="text-xs text-[#8e8e93]">
              Entrez votre mot de passe pour acc&eacute;der au CRM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#8e8e93] mb-1.5 font-medium">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Entrez votre mot de passe"
                  autoFocus
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#f5f5f7] text-sm placeholder:text-white/15 focus:outline-none focus:border-[rgba(10,132,255,0.5)]"
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
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(255,69,58,0.08)] border border-[rgba(255,69,58,0.2)] text-[#ff453a] text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0a84ff] hover:bg-[#409cff] text-white text-sm font-semibold transition-all disabled:opacity-50 btn-glow"
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

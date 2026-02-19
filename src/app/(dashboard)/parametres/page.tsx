'use client';

import { useEffect, useState } from 'react';
import { User, Bell, Shield, Database, Save, Check, Key, Plus, Trash2, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';
import Image from 'next/image';

// SHA-256 hash of the API keys password (OpexIA@API2026)
const API_PASSWORD_HASH = 'c4fd77d5f15a81214e53423e0880ffb7fb348bb91a0b8d2ece2add42aece1423';

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface ApiKeyRecord {
  id: string;
  provider: string;
  api_key: string;
  label: string;
  is_active: boolean;
  last_checked: string | null;
  last_usage_amount: number | null;
}

const PROVIDER_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'facturenet', label: 'Facture.net' },
];

export default function ParametresPage() {
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('profil');
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState(false);
  const [newKey, setNewKey] = useState({ provider: '', api_key: '', label: '' });
  const [fetchingUsage, setFetchingUsage] = useState(false);
  const [usageResult, setUsageResult] = useState<string | null>(null);

  // API Keys password lock
  const [apiUnlocked, setApiUnlocked] = useState(false);
  const [apiPassword, setApiPassword] = useState('');
  const [apiPasswordError, setApiPasswordError] = useState('');
  const [apiPasswordLoading, setApiPasswordLoading] = useState(false);

  // Security section - change CRM password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMessage, setPwdMessage] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Load API keys
  useEffect(() => {
    if (activeSection === 'api-keys' && apiUnlocked) {
      loadApiKeys();
    }
  }, [activeSection, apiUnlocked]);

  const loadApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch('/api/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (e) {
      console.error('Failed to load API keys:', e);
    }
    setLoadingKeys(false);
  };

  const handleUnlockApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiPasswordError('');
    setApiPasswordLoading(true);

    try {
      const hash = await sha256(apiPassword);
      if (hash === API_PASSWORD_HASH) {
        setApiUnlocked(true);
        setApiPassword('');
      } else {
        setApiPasswordError('Mot de passe incorrect');
      }
    } catch {
      setApiPasswordError('Erreur de v\u00e9rification');
    }

    setApiPasswordLoading(false);
  };

  const handleAddKey = async () => {
    if (!newKey.provider || !newKey.api_key) return;
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      });
      if (res.ok) {
        await loadApiKeys();
        setNewKey({ provider: '', api_key: '', label: '' });
        setAddingKey(false);
      }
    } catch (e) {
      console.error('Failed to add API key:', e);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Supprimer la cl\u00e9 ${provider} ?`)) return;
    try {
      await fetch(`/api/api-keys?provider=${provider}`, { method: 'DELETE' });
      await loadApiKeys();
    } catch (e) {
      console.error('Failed to delete API key:', e);
    }
  };

  const handleFetchUsage = async () => {
    setFetchingUsage(true);
    setUsageResult(null);
    try {
      const res = await fetch('/api/usage', { method: 'POST' });
      const data = await res.json();
      setUsageResult(`${data.results?.length || 0} provider(s) v\u00e9rifi\u00e9s. ${data.results?.filter((r: { amount: number }) => r.amount > 0).length || 0} avec des co\u00fbts d\u00e9tect\u00e9s.`);
      await loadApiKeys();
    } catch {
      setUsageResult('Erreur lors de la r\u00e9cup\u00e9ration des co\u00fbts');
    }
    setFetchingUsage(false);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
    return key.substring(0, 6) + '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + key.substring(key.length - 4);
  };

  const handleChangePassword = async () => {
    setPwdMessage('');
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMessage('Veuillez remplir tous les champs');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMessage('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPwd.length < 8) {
      setPwdMessage('Le mot de passe doit faire au moins 8 caract\u00e8res');
      return;
    }

    // Verify current password
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: currentPwd }),
      });
      if (!res.ok) {
        setPwdMessage('Mot de passe actuel incorrect');
        return;
      }
    } catch {
      setPwdMessage('Erreur de v\u00e9rification');
      return;
    }

    setPwdMessage('Mot de passe v\u00e9rifi\u00e9. Pour changer le mot de passe CRM, contactez l\'administrateur.');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  const sections = [
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'api-keys', label: 'Cl\u00e9s API', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'S\u00e9curit\u00e9', icon: Shield },
    { id: 'donnees', label: 'Donn\u00e9es', icon: Database },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Param&egrave;tres</h1>
        <p className="text-sm text-muted mt-1">G&eacute;rez votre compte et vos pr&eacute;f&eacute;rences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-card border border-border rounded-xl p-3">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted hover:text-foreground hover:bg-card-hover'
                  }`}
                >
                  <Icon size={18} />
                  {section.label}
                  {section.id === 'api-keys' && !apiUnlocked && (
                    <Lock size={12} className="ml-auto text-muted" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'profil' && (
            <div className="bg-card border border-border rounded-xl p-6 animate-fade-in space-y-6">
              <h2 className="text-lg font-bold text-foreground">Profil de l&apos;agence</h2>

              <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="OpexIA" width={64} height={64} className="rounded-xl" />
                <div>
                  <p className="font-medium text-foreground">OpexIA</p>
                  <p className="text-sm text-muted">Agence d&apos;automatisation IA</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Nom de l&apos;agence</label>
                  <input
                    type="text"
                    defaultValue="OpexIA"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue="contact@opexia.fr"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">T&eacute;l&eacute;phone</label>
                  <input
                    type="text"
                    defaultValue=""
                    placeholder="06 00 00 00 00"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Site web</label>
                  <input
                    type="text"
                    defaultValue=""
                    placeholder="https://opexia.fr"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
              >
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? 'Sauvegard\u00e9 !' : 'Enregistrer'}
              </button>
            </div>
          )}

          {/* API KEYS SECTION */}
          {activeSection === 'api-keys' && !apiUnlocked && (
            <div className="bg-card border border-border rounded-xl p-8 animate-fade-in">
              <div className="max-w-sm mx-auto text-center space-y-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                  <Lock size={28} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Acc&egrave;s prot&eacute;g&eacute;</h2>
                  <p className="text-sm text-muted mt-1">Entrez le mot de passe pour acc&eacute;der aux cl&eacute;s API</p>
                </div>

                <form onSubmit={handleUnlockApi} className="space-y-3">
                  <div className="relative">
                    <input
                      type="password"
                      value={apiPassword}
                      onChange={(e) => { setApiPassword(e.target.value); setApiPasswordError(''); }}
                      placeholder="Mot de passe"
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm text-center focus:outline-none focus:border-primary"
                    />
                  </div>
                  {apiPasswordError && (
                    <div className="flex items-center justify-center gap-2 text-danger text-sm">
                      <AlertCircle size={14} />
                      {apiPasswordError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={apiPasswordLoading || !apiPassword}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {apiPasswordLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Key size={16} />
                    )}
                    D&eacute;verrouiller
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeSection === 'api-keys' && apiUnlocked && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Cl&eacute;s API Providers</h2>
                    <p className="text-sm text-muted mt-0.5">G&eacute;rez vos cl&eacute;s API pour le suivi automatique des co&ucirc;ts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFetchUsage}
                      disabled={fetchingUsage}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {fetchingUsage ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {fetchingUsage ? 'V\u00e9rification...' : 'Actualiser les co\u00fbts'}
                    </button>
                    <button
                      onClick={() => setAddingKey(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                    >
                      <Plus size={14} />
                      Ajouter
                    </button>
                  </div>
                </div>

                {usageResult && (
                  <div className="p-3 rounded-xl bg-info/10 border border-info/20 text-sm text-info">
                    {usageResult}
                  </div>
                )}

                {loadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-muted" />
                  </div>
                ) : apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-border-light transition-colors bg-background">
                        <div className={`p-2.5 rounded-xl ${key.is_active ? 'bg-success/10' : 'bg-muted/10'}`}>
                          <Key size={18} className={key.is_active ? 'text-success' : 'text-muted'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm">{key.label || key.provider}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              key.is_active ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
                            }`}>
                              {key.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <code className="text-xs text-muted font-mono">
                              {showKeyId === key.id ? key.api_key : maskKey(key.api_key)}
                            </code>
                            <button
                              onClick={() => setShowKeyId(showKeyId === key.id ? null : key.id)}
                              className="text-muted hover:text-foreground transition-colors"
                            >
                              {showKeyId === key.id ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                          {key.last_checked && (
                            <p className="text-[10px] text-muted mt-1">
                              Derni&egrave;re v&eacute;rification : {new Date(key.last_checked).toLocaleString('fr-FR')}
                              {key.last_usage_amount !== null && key.last_usage_amount > 0 && (
                                <span className="ml-2 text-warning font-medium">
                                  {key.last_usage_amount.toFixed(2)} &euro;
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteKey(key.provider)}
                          className="p-2 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted">
                    <Key size={36} className="mx-auto mb-3 opacity-40" />
                    <p>Aucune cl&eacute; API configur&eacute;e</p>
                    <p className="text-xs mt-1">Ajoutez vos cl&eacute;s pour suivre les co&ucirc;ts automatiquement</p>
                  </div>
                )}
              </div>

              {/* Add Key Form */}
              {addingKey && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Nouvelle cl&eacute; API</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-muted mb-1">Provider</label>
                      <select
                        value={newKey.provider}
                        onChange={(e) => setNewKey({ ...newKey, provider: e.target.value, label: PROVIDER_OPTIONS.find(p => p.value === e.target.value)?.label || '' })}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">S&eacute;lectionner</option>
                        {PROVIDER_OPTIONS.filter(p => !apiKeys.find(k => k.provider === p.value)).map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted mb-1">Cl&eacute; API</label>
                      <input
                        type="text"
                        value={newKey.api_key}
                        onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                        placeholder="sk-... ou votre cl&eacute; API"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  {newKey.provider === 'twilio' && (
                    <p className="text-xs text-warning bg-warning/10 p-2 rounded-lg">
                      Format Twilio : ACCOUNT_SID:AUTH_TOKEN (s&eacute;par&eacute; par deux-points)
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setAddingKey(false); setNewKey({ provider: '', api_key: '', label: '' }); }}
                      className="px-4 py-2 rounded-xl border border-border text-muted text-sm hover:text-foreground transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddKey}
                      disabled={!newKey.provider || !newKey.api_key}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Enregistrer la cl&eacute;
                    </button>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle size={16} className="text-info" />
                  Comment &ccedil;a marche ?
                </h3>
                <div className="space-y-2 text-sm text-muted">
                  <p>Le CRM v&eacute;rifie automatiquement vos co&ucirc;ts API <strong className="text-foreground">chaque jour &agrave; 6h du matin</strong> via un cron Vercel.</p>
                  <p>Les co&ucirc;ts d&eacute;tect&eacute;s sont automatiquement ajout&eacute;s dans la section <strong className="text-foreground">Charges &amp; Abonnements</strong>.</p>
                  <p>Vous pouvez aussi cliquer sur <strong className="text-foreground">&quot;Actualiser les co&ucirc;ts&quot;</strong> pour une mise &agrave; jour manuelle imm&eacute;diate.</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {['Anthropic', 'Mistral', 'Gemini', 'ElevenLabs', 'OpenAI', 'Twilio'].map(name => (
                    <span key={name} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-card border border-border rounded-xl p-6 animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-foreground">Notifications</h2>
              {[
                { label: 'Nouvelles factures en retard', desc: 'Recevoir un rappel quand une facture est en retard' },
                { label: 'Rappels de rendez-vous', desc: '30 minutes avant chaque RDV' },
                { label: 'Nouveaux prospects', desc: 'Quand un nouveau prospect est ajout\u00e9' },
                { label: 'Deadlines projets', desc: '24h avant la deadline d\'un projet' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border-light">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-5 bg-background rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'securite' && (
            <div className="bg-card border border-border rounded-xl p-6 animate-fade-in space-y-5">
              <h2 className="text-lg font-bold text-foreground">S&eacute;curit&eacute;</h2>

              {/* Password status */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <Shield size={18} className="text-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">CRM prot&eacute;g&eacute; par mot de passe</p>
                  <p className="text-xs text-muted">Authentification requise pour acc&eacute;der au CRM</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <Lock size={18} className="text-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Cl&eacute;s API v&eacute;rouill&eacute;es</p>
                  <p className="text-xs text-muted">Mot de passe suppl&eacute;mentaire pour la section Cl&eacute;s API</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <CheckCircle size={18} className="text-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Headers de s&eacute;curit&eacute; actifs</p>
                  <p className="text-xs text-muted">X-Frame-Options, X-Content-Type-Options, HSTS, XSS Protection</p>
                </div>
              </div>

              {/* Change password */}
              <div className="border-t border-border pt-5 space-y-4">
                <h3 className="font-semibold text-foreground text-sm">Changer le mot de passe CRM</h3>
                <div>
                  <label className="block text-xs text-muted mb-1">Mot de passe actuel</label>
                  <input
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Confirmer</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                {pwdMessage && (
                  <p className={`text-sm ${pwdMessage.includes('incorrect') || pwdMessage.includes('correspondent') || pwdMessage.includes('caract') || pwdMessage.includes('remplir') ? 'text-danger' : 'text-info'}`}>
                    {pwdMessage}
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
                >
                  <Save size={16} />
                  Mettre &agrave; jour
                </button>
              </div>
            </div>
          )}

          {activeSection === 'donnees' && (
            <div className="bg-card border border-border rounded-xl p-6 animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-foreground">Donn&eacute;es</h2>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <CheckCircle size={18} className="text-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Base de donn&eacute;es connect&eacute;e</p>
                  <p className="text-xs text-muted">Vos donn&eacute;es sont stock&eacute;es de mani&egrave;re s&eacute;curis&eacute;e sur Supabase (PostgreSQL)</p>
                </div>
              </div>
              <div className="text-sm text-muted space-y-1">
                <p>Tables : clients, charges, invoices, devis, interactions, events, api_keys</p>
                <p>Cron auto : tous les jours &agrave; 6h00 (fetch co&ucirc;ts API)</p>
                <p>S&eacute;curit&eacute; : RLS activ&eacute;, acc&egrave;s service_role uniquement</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Settings, User, Bell, Shield, Palette, Database, Save, Check, Key, Plus, Trash2, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Load API keys
  useEffect(() => {
    if (activeSection === 'api-keys') {
      loadApiKeys();
    }
  }, [activeSection]);

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
    if (!confirm(`Supprimer la clé ${provider} ?`)) return;
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
      setUsageResult(`${data.results?.length || 0} provider(s) vérifiés. ${data.results?.filter((r: { amount: number }) => r.amount > 0).length || 0} avec des coûts détectés.`);
      await loadApiKeys();
    } catch (e) {
      setUsageResult('Erreur lors de la récupération des coûts');
    }
    setFetchingUsage(false);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
  };

  const sections = [
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'api-keys', label: 'Clés API', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité', icon: Shield },
    { id: 'apparence', label: 'Apparence', icon: Palette },
    { id: 'donnees', label: 'Données', icon: Database },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted mt-1">Gérez votre compte et vos préférences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-card border border-border rounded-2xl p-3">
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'profil' && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in space-y-6">
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
                  <label className="block text-xs text-muted mb-1">Téléphone</label>
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
                {saved ? 'Sauvegardé !' : 'Enregistrer'}
              </button>
            </div>
          )}

          {/* API KEYS SECTION */}
          {activeSection === 'api-keys' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Clés API Providers</h2>
                    <p className="text-sm text-muted mt-0.5">Gérez vos clés API pour le suivi automatique des coûts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFetchUsage}
                      disabled={fetchingUsage}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {fetchingUsage ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {fetchingUsage ? 'Vérification...' : 'Actualiser les coûts'}
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
                              Dernière vérification : {new Date(key.last_checked).toLocaleString('fr-FR')}
                              {key.last_usage_amount !== null && key.last_usage_amount > 0 && (
                                <span className="ml-2 text-warning font-medium">
                                  {key.last_usage_amount.toFixed(2)} €
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
                    <p>Aucune clé API configurée</p>
                    <p className="text-xs mt-1">Ajoutez vos clés pour suivre les coûts automatiquement</p>
                  </div>
                )}
              </div>

              {/* Add Key Form */}
              {addingKey && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Nouvelle clé API</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-muted mb-1">Provider</label>
                      <select
                        value={newKey.provider}
                        onChange={(e) => setNewKey({ ...newKey, provider: e.target.value, label: PROVIDER_OPTIONS.find(p => p.value === e.target.value)?.label || '' })}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Sélectionner</option>
                        {PROVIDER_OPTIONS.filter(p => !apiKeys.find(k => k.provider === p.value)).map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted mb-1">Clé API</label>
                      <input
                        type="text"
                        value={newKey.api_key}
                        onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                        placeholder="sk-... ou votre clé API"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  {newKey.provider === 'twilio' && (
                    <p className="text-xs text-warning bg-warning/10 p-2 rounded-lg">
                      Format Twilio : ACCOUNT_SID:AUTH_TOKEN (séparé par deux-points)
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
                      Enregistrer la clé
                    </button>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle size={16} className="text-info" />
                  Comment ça marche ?
                </h3>
                <div className="space-y-2 text-sm text-muted">
                  <p>Le CRM vérifie automatiquement vos coûts API <strong className="text-foreground">chaque jour à 6h du matin</strong> via un cron Vercel.</p>
                  <p>Les coûts détectés sont automatiquement ajoutés dans la section <strong className="text-foreground">Charges & Abonnements</strong>.</p>
                  <p>Vous pouvez aussi cliquer sur <strong className="text-foreground">&quot;Actualiser les coûts&quot;</strong> pour une mise à jour manuelle immédiate.</p>
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
            <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-foreground">Notifications</h2>
              {[
                { label: 'Nouvelles factures en retard', desc: 'Recevoir un rappel quand une facture est en retard' },
                { label: 'Rappels de rendez-vous', desc: '30 minutes avant chaque RDV' },
                { label: 'Nouveaux prospects', desc: 'Quand un nouveau prospect est ajouté' },
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
            <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-foreground">Sécurité</h2>
              <div>
                <label className="block text-xs text-muted mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Confirmer</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
              >
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? 'Sauvegardé !' : 'Mettre à jour'}
              </button>
            </div>
          )}

          {activeSection === 'apparence' && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-foreground">Apparence</h2>
              <p className="text-sm text-muted">Le thème sombre est activé.</p>
              <div className="flex gap-4">
                <div className="p-4 rounded-xl border border-border bg-card w-24 h-16 flex items-center justify-center opacity-50">
                  <span className="text-xs text-muted font-medium">Clair</span>
                </div>
                <div className="p-4 rounded-xl border-2 border-primary bg-background w-24 h-16 flex items-center justify-center active-glow">
                  <span className="text-xs text-foreground font-medium">Sombre</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'donnees' && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-foreground">Données</h2>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <CheckCircle size={18} className="text-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Supabase connecté</p>
                  <p className="text-xs text-muted">Vos données sont stockées de manière sécurisée sur Supabase (PostgreSQL)</p>
                </div>
              </div>
              <div className="text-sm text-muted space-y-1">
                <p>Base de données : <code className="text-xs bg-background px-1.5 py-0.5 rounded">hpunlrlvtkjifskigkca.supabase.co</code></p>
                <p>Tables : clients, charges, invoices, interactions, events, api_keys, usage_logs</p>
                <p>Cron auto : tous les jours à 6h00 (fetch coûts API)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

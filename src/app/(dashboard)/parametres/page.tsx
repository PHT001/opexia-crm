'use client';

import { useState } from 'react';
import { Settings, User, Bell, Shield, Palette, Database, Save, Check } from 'lucide-react';
import Image from 'next/image';

export default function ParametresPage() {
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('profil');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: 'profil', label: 'Profil', icon: User },
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
              <p className="text-sm text-muted">Le thème clair est activé par défaut.</p>
              <div className="flex gap-4">
                <div className="p-4 rounded-xl border-2 border-primary bg-white w-24 h-16 flex items-center justify-center shadow-sm">
                  <span className="text-xs text-gray-800 font-medium">Clair</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-gray-900 w-24 h-16 flex items-center justify-center opacity-50">
                  <span className="text-xs text-gray-400 font-medium">Sombre</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'donnees' && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-foreground">Données</h2>
              <p className="text-sm text-muted">
                Les données sont stockées localement dans votre navigateur. Pour une utilisation en production, connectez Supabase.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const data = {
                      clients: localStorage.getItem('opexia_clients'),
                      projects: localStorage.getItem('opexia_projects'),
                      invoices: localStorage.getItem('opexia_invoices'),
                      interactions: localStorage.getItem('opexia_interactions'),
                      events: localStorage.getItem('opexia_events'),
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `opexia-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
                >
                  Exporter les données
                </button>
                <button
                  onClick={() => {
                    if (confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) {
                      localStorage.removeItem('opexia_clients');
                      localStorage.removeItem('opexia_projects');
                      localStorage.removeItem('opexia_invoices');
                      localStorage.removeItem('opexia_interactions');
                      localStorage.removeItem('opexia_events');
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 text-sm font-medium transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

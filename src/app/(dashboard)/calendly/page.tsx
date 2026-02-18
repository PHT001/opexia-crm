'use client';

import { ExternalLink, Video, Clock, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/opexia';

export default function CalendlyPage() {
  const [key, setKey] = useState(0);

  return (
    <div className="p-4 lg:p-6 space-y-4 pt-16 lg:pt-6 h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rendez-vous Calendly</h1>
          <p className="text-sm text-muted mt-1">Gérez vos appels et rendez-vous directement depuis le CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey(k => k + 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-card-hover text-sm font-medium transition-colors"
          >
            <RefreshCw size={15} />
            Rafraîchir
          </button>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
          >
            <ExternalLink size={15} />
            Ouvrir Calendly
          </a>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Video size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted">Lien de réservation</p>
            <p className="text-sm font-medium text-foreground truncate">calendly.com/opexia</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Clock size={18} className="text-success" />
          </div>
          <div>
            <p className="text-xs text-muted">Statut</p>
            <p className="text-sm font-medium text-success">Actif</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <Video size={18} className="text-info" />
          </div>
          <div>
            <p className="text-xs text-muted">Intégration</p>
            <p className="text-sm font-medium text-foreground">Embed direct</p>
          </div>
        </div>
      </div>

      {/* Calendly Embed */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden min-h-0">
        <iframe
          key={key}
          src={CALENDLY_URL}
          width="100%"
          height="100%"
          frameBorder="0"
          title="Calendly - OpexIA"
          className="w-full h-full"
          style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
}

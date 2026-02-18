'use client';

import { ExternalLink, Video, Clock, RefreshCw, Calendar, Link2 } from 'lucide-react';
import { useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/opexia';
const GOOGLE_CALENDAR_EMAIL = 'opexiapro@gmail.com';
const GOOGLE_CALENDAR_EMBED = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(GOOGLE_CALENDAR_EMAIL)}&ctz=Europe%2FParis&mode=week&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&bgcolor=%23ffffff`;

type ActiveView = 'agenda' | 'calendly';

export default function CalendlyPage() {
  const [key, setKey] = useState(0);
  const [activeView, setActiveView] = useState<ActiveView>('agenda');

  return (
    <div className="p-4 lg:p-6 space-y-4 pt-16 lg:pt-6 h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rendez-vous</h1>
          <p className="text-sm text-muted mt-1">Vos RDV Calendly synchronisés avec Google Agenda</p>
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

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Link2 size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted">Lien de réservation</p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">
              calendly.com/opexia
            </a>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Clock size={18} className="text-success" />
          </div>
          <div>
            <p className="text-xs text-muted">Synchronisation</p>
            <p className="text-sm font-medium text-success">Google Agenda connecté</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <Calendar size={18} className="text-info" />
          </div>
          <div>
            <p className="text-xs text-muted">Compte</p>
            <p className="text-sm font-medium text-foreground truncate">{GOOGLE_CALENDAR_EMAIL}</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 self-start flex-shrink-0">
        <button
          onClick={() => setActiveView('agenda')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'agenda'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-card-hover'
          }`}
        >
          <Calendar size={15} />
          Mes RDV (Agenda)
        </button>
        <button
          onClick={() => setActiveView('calendly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'calendly'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-card-hover'
          }`}
        >
          <Video size={15} />
          Page Calendly
        </button>
      </div>

      {/* Embed */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden min-h-0">
        {activeView === 'agenda' ? (
          <iframe
            key={`agenda-${key}`}
            src={GOOGLE_CALENDAR_EMBED}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Google Agenda - OpexIA"
            className="w-full h-full"
            style={{ minHeight: '600px', border: 0 }}
          />
        ) : (
          <iframe
            key={`calendly-${key}`}
            src={CALENDLY_URL}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Calendly - OpexIA"
            className="w-full h-full"
            style={{ minHeight: '600px' }}
          />
        )}
      </div>
    </div>
  );
}

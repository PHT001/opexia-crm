'use client';

import { ExternalLink, Clock, RefreshCw, Calendar, Link2 } from 'lucide-react';
import { useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/opexia';
const GOOGLE_CALENDAR_EMAIL = 'opexiapro@gmail.com';
const GOOGLE_CALENDAR_EMBED = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(GOOGLE_CALENDAR_EMAIL)}&ctz=Europe%2FParis&mode=week&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&bgcolor=%23ffffff`;

export default function CalendlyPage() {
  const [key, setKey] = useState(0);

  return (
    <div className="p-4 lg:p-6 space-y-4 pt-16 lg:pt-6 h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white/90">Rendez-vous</h1>
          <p className="text-xs text-white/30 mt-1">Vos RDV Calendly synchronisés avec Google Agenda</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey(k => k + 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.06] text-white/60 hover:bg-white/[0.03] text-xs font-medium transition-colors"
          >
            <RefreshCw size={15} />
            Rafraîchir
          </button>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6df0] text-white text-xs font-medium transition-colors"
          >
            <ExternalLink size={15} />
            Ouvrir Calendly
          </a>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(108,92,231,0.08)]">
            <Link2 size={18} className="text-[#a78bfa]" />
          </div>
          <div>
            <p className="text-xs text-white/30">Lien de réservation</p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#a78bfa] hover:underline truncate block">
              calendly.com/opexia
            </a>
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(52,211,153,0.08)]">
            <Clock size={18} className="text-[#34d399]" />
          </div>
          <div>
            <p className="text-xs text-white/30">Synchronisation</p>
            <p className="text-sm font-medium text-[#34d399]">Google Agenda connecté</p>
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(96,165,250,0.08)]">
            <Calendar size={18} className="text-[#60a5fa]" />
          </div>
          <div>
            <p className="text-xs text-white/30">Compte</p>
            <p className="text-sm font-medium text-white/90 truncate">{GOOGLE_CALENDAR_EMAIL}</p>
          </div>
        </div>
      </div>

      {/* Google Agenda Embed */}
      <div className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden min-h-0">
        <iframe
          key={key}
          src={GOOGLE_CALENDAR_EMBED}
          width="100%"
          height="100%"
          frameBorder="0"
          title="Google Agenda - OpexIA"
          className="w-full h-full"
          style={{ minHeight: '600px', border: 0 }}
        />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from 'lucide-react';
import { getEvents, getClients, saveEvent, generateId } from '@/lib/store';
import { CalendarEvent, Client } from '@/lib/types';
import Modal from '@/components/Modal';

export default function CalendrierPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEvents(getEvents());
    setClients(getClients());
    setMounted(true);
  }, []);

  const refresh = () => setEvents(getEvents());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEventsForDay = (day: number) =>
    events.filter(e => e.date === getDateStr(day));

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const eventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'rdv': return 'bg-primary';
      case 'deadline': return 'bg-danger';
      case 'rappel': return 'bg-warning';
      default: return 'bg-info';
    }
  };

  const upcomingEvents = [...events]
    .filter(e => e.date >= today.toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))
    .slice(0, 8);

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const c = clients.find(cl => cl.id === clientId);
    return c ? `${c.prenom} ${c.nom}` : null;
  };

  if (!mounted) return <div className="p-6 pt-16 lg:pt-6"><div className="h-8 w-48 bg-card rounded animate-pulse" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendrier</h1>
          <p className="text-sm text-muted mt-1">{events.length} événements planifiés</p>
        </div>
        <button
          onClick={() => { setSelectedDate(today.toISOString().split('T')[0]); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nouvel événement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground capitalize">
                {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={goToday}
                className="px-3 py-1 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Aujourd&apos;hui
              </button>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs text-muted font-medium py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-20" />;
              }

              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate === getDateStr(day);

              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDate(getDateStr(day));
                  }}
                  className={`h-20 p-1.5 rounded-xl border text-left transition-all hover:bg-card-hover ${
                    isToday(day)
                      ? 'border-primary bg-primary/5'
                      : isSelected
                        ? 'border-border-light bg-card-hover'
                        : 'border-transparent'
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    isToday(day) ? 'text-primary' : 'text-foreground'
                  }`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`${eventTypeColor(ev.type)} rounded px-1 py-0.5 text-[9px] text-white truncate leading-tight`}
                      >
                        {ev.heure} {ev.titre}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-muted text-center">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming Events */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Prochains événements</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const clientName = getClientName(event.clientId);
              return (
                <div key={event.id} className="p-3 rounded-xl border border-border-light hover:bg-card-hover transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${eventTypeColor(event.type)}`} />
                    <p className="text-sm font-medium text-foreground truncate">{event.titre}</p>
                  </div>
                  <div className="space-y-1 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} />
                      <span>
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {event.heure} · {event.duree} min
                      </span>
                    </div>
                    {clientName && (
                      <div className="flex items-center gap-1.5">
                        <User size={11} />
                        <span>{clientName}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="text-muted/70 truncate">{event.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-muted text-center py-8">Aucun événement à venir</p>
            )}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <NewEventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        defaultDate={selectedDate || today.toISOString().split('T')[0]}
        onSave={() => { refresh(); setModalOpen(false); }}
      />
    </div>
  );
}

function NewEventModal({ isOpen, onClose, clients, defaultDate, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  defaultDate: string;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    titre: '',
    date: defaultDate,
    heure: '09:00',
    duree: 30,
    type: 'rdv' as CalendarEvent['type'],
    clientId: '',
    description: '',
  });

  useEffect(() => {
    setForm(prev => ({ ...prev, date: defaultDate }));
  }, [defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEvent({
      id: generateId(),
      titre: form.titre,
      date: form.date,
      heure: form.heure,
      duree: form.duree,
      type: form.type,
      clientId: form.clientId || undefined,
      description: form.description || undefined,
    });
    onSave();
    setForm({ titre: '', date: defaultDate, heure: '09:00', duree: 30, type: 'rdv', clientId: '', description: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvel événement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1">Titre</label>
          <input
            type="text"
            required
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Heure</label>
            <input
              type="time"
              value={form.heure}
              onChange={(e) => setForm({ ...form, heure: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Durée (min)</label>
            <input
              type="number"
              min={5}
              step={5}
              value={form.duree}
              onChange={(e) => setForm({ ...form, duree: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as CalendarEvent['type'] })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="rdv">Rendez-vous</option>
              <option value="deadline">Deadline</option>
              <option value="rappel">Rappel</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Client (optionnel)</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Aucun</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.entreprise}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-foreground transition-colors">
            Annuler
          </button>
          <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
            Créer
          </button>
        </div>
      </form>
    </Modal>
  );
}

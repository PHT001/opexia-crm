'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Receipt,
  FolderKanban,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar as CalIcon,
  Clock,
  Plus,
  UserPlus,
  GitBranch,
} from 'lucide-react';
import { getClients, getProjects, getInvoices, getInteractions, getEvents } from '@/lib/store';
import { Client, Project, Invoice, Interaction, CalendarEvent, SERVICE_LABELS } from '@/lib/types';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setClients(getClients());
    setProjects(getProjects());
    setInvoices(getInvoices());
    setInteractions(getInteractions());
    setEvents(getEvents());
    setMounted(true);
  }, []);

  if (!mounted) return <DashboardSkeleton />;

  const isEmpty = clients.length === 0;

  const totalClients = clients.filter(c => c.status === 'client').length;
  const totalProspects = clients.filter(c => c.status === 'prospect').length;
  const caMensuel = clients.filter(c => c.status === 'client').reduce((sum, c) => sum + c.montantMensuel, 0);
  const caAnnuel = caMensuel * 12;
  const projetsEnCours = projects.filter(p => p.status === 'en-cours').length;
  const facturesEnRetard = invoices.filter(i => i.status === 'en-retard').length;
  const facturesEnAttente = invoices.filter(i => i.status === 'en-attente').length;
  const tauxConversion = clients.length > 0
    ? Math.round((totalClients / (totalClients + totalProspects + clients.filter(c => c.status === 'perdu').length)) * 100)
    : 0;

  // Build revenue chart from actual invoices
  const monthlyRevenue: Record<string, number> = {};
  invoices.filter(i => i.status === 'payee').forEach(inv => {
    monthlyRevenue[inv.mois] = (monthlyRevenue[inv.mois] || 0) + inv.montant;
  });
  const revenueData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mois, montant]) => ({
      mois: new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
      montant,
    }));

  const serviceDistribution = [
    { name: 'Site Web', value: clients.filter(c => c.servicesSouscrits.includes('site-web')).length, color: '#6c5ce7' },
    { name: 'Chatbot', value: clients.filter(c => c.servicesSouscrits.includes('chatbot')).length, color: '#00cec9' },
    { name: 'Réceptionniste', value: clients.filter(c => c.servicesSouscrits.includes('receptionniste-ia')).length, color: '#00b894' },
    { name: 'Automatisation', value: clients.filter(c => c.servicesSouscrits.includes('automatisation')).length, color: '#fdcb6e' },
  ].filter(s => s.value > 0);

  const pipelineData = [
    { stage: 'Contact', count: clients.filter(c => c.pipelineStage === 'contact').length },
    { stage: 'Démo', count: clients.filter(c => c.pipelineStage === 'demo').length },
    { stage: 'Proposition', count: clients.filter(c => c.pipelineStage === 'proposition').length },
    { stage: 'Négo', count: clients.filter(c => c.pipelineStage === 'negociation').length },
    { stage: 'Signé', count: clients.filter(c => c.pipelineStage === 'signe').length },
  ];

  const recentInteractions = [...interactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const upcomingEvents = [...events]
    .filter(e => e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))
    .slice(0, 4);

  const interactionIcon = (type: string) => {
    switch (type) {
      case 'appel': return <Phone size={14} />;
      case 'email': return <Mail size={14} />;
      case 'rdv': return <CalIcon size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted mt-1">Vue d&apos;ensemble de votre activité</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Empty state - Welcome */}
      {isEmpty && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Bienvenue sur OpexIA CRM</h2>
          <p className="text-muted max-w-md mx-auto mb-6">
            Commencez par ajouter vos premiers clients et prospects pour voir vos statistiques ici.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/clients"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              <UserPlus size={16} />
              Ajouter un client
            </Link>
            <Link
              href="/pipeline"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-card-hover text-sm font-medium transition-colors"
            >
              <GitBranch size={16} />
              Voir le pipeline
            </Link>
            <Link
              href="/calendrier"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-card-hover text-sm font-medium transition-colors"
            >
              <CalIcon size={16} />
              Planifier un RDV
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="CA Mensuel"
          value={`${caMensuel.toLocaleString('fr-FR')} €`}
          change={totalClients > 0 ? `${totalClients} client${totalClients > 1 ? 's' : ''} actif${totalClients > 1 ? 's' : ''}` : 'Aucun client'}
          positive={caMensuel > 0}
          icon={<TrendingUp size={20} />}
          color="primary"
        />
        <KPICard
          title="Clients actifs"
          value={totalClients.toString()}
          change={`${totalProspects} prospect${totalProspects > 1 ? 's' : ''}`}
          positive={totalClients > 0}
          icon={<UserCheck size={20} />}
          color="success"
        />
        <KPICard
          title="Projets en cours"
          value={projetsEnCours.toString()}
          change={`${projects.filter(p => p.status === 'termine').length} terminé${projects.filter(p => p.status === 'termine').length > 1 ? 's' : ''}`}
          positive={projetsEnCours > 0}
          icon={<FolderKanban size={20} />}
          color="info"
        />
        <KPICard
          title="Factures en retard"
          value={facturesEnRetard.toString()}
          change={`${facturesEnAttente} en attente`}
          positive={facturesEnRetard === 0}
          icon={<AlertCircle size={20} />}
          color="danger"
        />
      </div>

      {/* Charts Row - only show if data exists */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Évolution du CA</h3>
                <p className="text-xs text-muted">Basé sur les factures payées</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold gradient-text">{caAnnuel.toLocaleString('fr-FR')} €/an</p>
              </div>
            </div>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#1a1a2e', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €`, 'CA']}
                  />
                  <Area type="monotone" dataKey="montant" stroke="#6c5ce7" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60 text-muted text-sm">
                <div className="text-center">
                  <Receipt size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Ajoutez des factures pour voir le graphique</p>
                  <Link href="/facturation" className="text-primary text-xs hover:underline mt-1 inline-block">
                    Aller à la facturation
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Service Distribution */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Services souscrits</h3>
            {serviceDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {serviceDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#1a1a2e', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {serviceDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                        <span className="text-muted">{item.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-60 text-muted text-sm">
                <div className="text-center">
                  <FolderKanban size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Aucun service souscrit</p>
                  <p className="text-xs mt-1 opacity-60">Assignez des services à vos clients</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Pipeline</h3>
            <Link href="/pipeline" className="text-xs text-primary hover:text-primary-hover">
              Voir tout
            </Link>
          </div>
          {clients.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="stage" stroke="#6b7280" fontSize={11} width={70} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#1a1a2e', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="count" fill="#6c5ce7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted">Taux de conversion</span>
                <span className="font-bold text-success">{tauxConversion}%</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-52 text-muted text-sm">
              <div className="text-center">
                <GitBranch size={32} className="mx-auto mb-2 opacity-40" />
                <p>Pipeline vide</p>
                <Link href="/clients" className="text-primary text-xs hover:underline mt-1 inline-block">
                  Ajouter un contact
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Interactions */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Activité récente</h3>
          </div>
          {recentInteractions.length > 0 ? (
            <div className="space-y-3">
              {recentInteractions.map((inter) => {
                const client = clients.find(c => c.id === inter.clientId);
                return (
                  <div key={inter.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-card-hover transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                      {interactionIcon(inter.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inter.sujet}</p>
                      <p className="text-xs text-muted truncate">{client?.entreprise}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-52 text-muted text-sm">
              <div className="text-center">
                <Mail size={32} className="mx-auto mb-2 opacity-40" />
                <p>Aucune activité</p>
                <p className="text-xs mt-1 opacity-60">Les interactions avec vos clients apparaitront ici</p>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Prochains RDV</h3>
            <Link href="/calendrier" className="text-xs text-primary hover:text-primary-hover">
              Voir tout
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 rounded-xl border border-border-light hover:bg-card-hover transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'rdv' ? 'bg-primary' :
                      event.type === 'deadline' ? 'bg-danger' :
                      'bg-warning'
                    }`} />
                    <p className="text-sm font-medium text-foreground truncate">{event.titre}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <span>{event.heure}</span>
                    <span>{event.duree} min</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-52 text-muted text-sm">
              <div className="text-center">
                <CalIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p>Aucun RDV à venir</p>
                <Link href="/calendrier" className="text-primary text-xs hover:underline mt-1 inline-block">
                  Planifier un événement
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Clients */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Derniers clients / prospects</h3>
          <Link href="/clients" className="text-xs text-primary hover:text-primary-hover">
            {clients.length > 0 ? 'Voir tous' : 'Ajouter'}
          </Link>
        </div>
        {clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="pb-3 font-medium">Nom</th>
                  <th className="pb-3 font-medium">Entreprise</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Services</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Mensuel</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 5).map((client) => (
                  <tr key={client.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                    <td className="py-3">
                      <Link href={`/clients/${client.id}`} className="text-foreground hover:text-primary font-medium">
                        {client.prenom} {client.nom}
                      </Link>
                    </td>
                    <td className="py-3 text-muted">{client.entreprise}</td>
                    <td className="py-3 hidden sm:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {client.servicesSouscrits.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {SERVICE_LABELS[s]}
                          </span>
                        ))}
                        {client.servicesSouscrits.length === 0 && (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell font-medium">
                      {client.montantMensuel > 0 ? `${client.montantMensuel} €` : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium status-${client.status}`}>
                        {client.status === 'client' ? 'Client' : client.status === 'prospect' ? 'Prospect' : 'Perdu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted">
            <Users size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun contact pour le moment</p>
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              <Plus size={14} />
              Ajouter votre premier contact
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ title, value, change, positive, icon, color }: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 hover:border-border-light transition-colors animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted font-medium uppercase tracking-wide">{title}</span>
        <div className={`p-2 rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {positive ? (
          <ArrowUpRight size={14} className="text-success" />
        ) : (
          <ArrowDownRight size={14} className="text-danger" />
        )}
        <span className={`text-xs ${positive ? 'text-success' : 'text-danger'}`}>{change}</span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      <div className="h-8 w-48 bg-card rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 h-32 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl h-80 animate-pulse" />
        <div className="bg-card border border-border rounded-2xl h-80 animate-pulse" />
      </div>
    </div>
  );
}

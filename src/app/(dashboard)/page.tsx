'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Receipt,
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
  Wallet,
  Trash2,
  Edit3,
  CreditCard,
  TrendingDown,
  X,
} from 'lucide-react';
import { getClients, getInvoices, getInteractions, getEvents, getCharges, saveCharge, deleteCharge, generateId } from '@/lib/store';
import { Client, Invoice, Interaction, CalendarEvent, Charge, ChargeCategory, ChargeFrequency, SERVICE_LABELS, CHARGE_CATEGORY_LABELS, CHARGE_FREQUENCY_LABELS } from '@/lib/types';
import Link from 'next/link';
import Modal from '@/components/Modal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [mounted, setMounted] = useState(false);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [c, inv, inter, ev, ch] = await Promise.all([
        getClients(),
        getInvoices(),
        getInteractions(),
        getEvents(),
        getCharges(),
      ]);
      setClients(c);
      setInvoices(inv);
      setInteractions(inter);
      setEvents(ev);
      setCharges(ch);
      setMounted(true);
    };
    loadData();
  }, []);

  const refreshCharges = async () => setCharges(await getCharges());

  if (!mounted) return <DashboardSkeleton />;

  const isEmpty = clients.length === 0;

  const totalClients = clients.filter(c => c.status === 'client').length;
  const totalProspects = clients.filter(c => c.status === 'prospect').length;
  const caMensuel = clients.filter(c => c.status === 'client').reduce((sum, c) => sum + c.montantMensuel, 0);
  const caAnnuel = caMensuel * 12;
  const facturesEnRetard = invoices.filter(i => i.status === 'en-retard').length;
  const facturesEnAttente = invoices.filter(i => i.status === 'en-attente').length;
  const tauxConversion = clients.length > 0
    ? Math.round((totalClients / (totalClients + totalProspects + clients.filter(c => c.status === 'perdu').length)) * 100)
    : 0;

  // Charges calculations
  const activeCharges = charges.filter(c => c.actif);
  const chargesMensuelles = activeCharges.reduce((sum, c) => {
    switch (c.frequence) {
      case 'mensuel': return sum + c.montant;
      case 'annuel': return sum + c.montant / 12;
      case 'trimestriel': return sum + c.montant / 3;
      case 'ponctuel': return sum;
      default: return sum;
    }
  }, 0);
  const totalChargesCount = activeCharges.length;
  const beneficeMensuel = caMensuel - chargesMensuelles;

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
    { name: 'Site Web', value: clients.filter(c => c.servicesSouscrits.includes('site-web')).length, color: '#818cf8' },
    { name: 'Chatbot', value: clients.filter(c => c.servicesSouscrits.includes('chatbot')).length, color: '#60a5fa' },
    { name: 'Réceptionniste', value: clients.filter(c => c.servicesSouscrits.includes('receptionniste-ia')).length, color: '#4ade80' },
    { name: 'Automatisation', value: clients.filter(c => c.servicesSouscrits.includes('automatisation')).length, color: '#a78bfa' },
  ].filter(s => s.value > 0);

  const pipelineData = [
    { stage: 'Contact', count: clients.filter(c => c.pipelineStage === 'contact').length },
    { stage: 'Démo', count: clients.filter(c => c.pipelineStage === 'demo').length },
    { stage: 'Proposition', count: clients.filter(c => c.pipelineStage === 'proposition').length },
    { stage: 'Négo', count: clients.filter(c => c.pipelineStage === 'negociation').length },
    { stage: 'Signé', count: clients.filter(c => c.pipelineStage === 'signe').length },
  ];

  // Charges by category for pie chart
  const chargesByCategoryColors: Record<ChargeCategory, string> = {
    'abonnement': '#818cf8',
    'logiciel': '#60a5fa',
    'marketing': '#facc15',
    'hebergement': '#4ade80',
    'telephonie': '#f97316',
    'freelance': '#38bdf8',
    'materiel': '#f87171',
    'formation': '#a78bfa',
    'autre': '#71717a',
  };

  const chargesByCategory = Object.entries(CHARGE_CATEGORY_LABELS)
    .map(([key, label]) => {
      const catCharges = activeCharges.filter(c => c.categorie === key);
      const total = catCharges.reduce((sum, c) => {
        switch (c.frequence) {
          case 'mensuel': return sum + c.montant;
          case 'annuel': return sum + c.montant / 12;
          case 'trimestriel': return sum + c.montant / 3;
          case 'ponctuel': return sum;
          default: return sum;
        }
      }, 0);
      return { name: label, value: Math.round(total * 100) / 100, color: chargesByCategoryColors[key as ChargeCategory] };
    })
    .filter(c => c.value > 0);

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

  const handleDeleteCharge = async (id: string) => {
    if (confirm('Supprimer cette charge ?')) {
      await deleteCharge(id);
      await refreshCharges();
    }
  };

  const handleSaveCharge = async (charge: Charge) => {
    await saveCharge(charge);
    await refreshCharges();
    setChargeModalOpen(false);
    setEditingCharge(null);
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
          title="Charges /mois"
          value={`${Math.round(chargesMensuelles).toLocaleString('fr-FR')} €`}
          change={`${totalChargesCount} charge${totalChargesCount > 1 ? 's' : ''} active${totalChargesCount > 1 ? 's' : ''}`}
          positive={chargesMensuelles === 0}
          icon={<Wallet size={20} />}
          color="warning"
        />
        <KPICard
          title="Bénéfice /mois"
          value={`${Math.round(beneficeMensuel).toLocaleString('fr-FR')} €`}
          change={beneficeMensuel > 0 ? 'Rentable' : beneficeMensuel === 0 ? 'Équilibre' : 'Déficitaire'}
          positive={beneficeMensuel >= 0}
          icon={<CreditCard size={20} />}
          color={beneficeMensuel >= 0 ? 'success' : 'danger'}
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
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="mois" stroke="#52525b" fontSize={12} />
                  <YAxis stroke="#52525b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#111113', border: '1px solid #1e1e22', borderRadius: '8px', color: '#fafafa', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                    formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €`, 'CA']}
                  />
                  <Area type="monotone" dataKey="montant" stroke="#818cf8" fill="url(#colorRevenue)" strokeWidth={2} />
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
                      contentStyle={{ background: '#111113', border: '1px solid #1e1e22', borderRadius: '8px', color: '#fafafa', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
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
                  <Receipt size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Aucun service souscrit</p>
                  <p className="text-xs mt-1 opacity-60">Assignez des services à vos clients</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Charges List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Wallet size={18} className="text-warning" />
                Charges & Abonnements
              </h3>
              <p className="text-xs text-muted mt-0.5">Suivi de vos frais récurrents et ponctuels</p>
            </div>
            <button
              onClick={() => { setEditingCharge(null); setChargeModalOpen(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>

          {activeCharges.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {charges
                .sort((a, b) => {
                  if (a.actif && !b.actif) return -1;
                  if (!a.actif && b.actif) return 1;
                  return b.montant - a.montant;
                })
                .map((charge) => {
                  const montantMensuel = charge.frequence === 'mensuel' ? charge.montant
                    : charge.frequence === 'annuel' ? charge.montant / 12
                    : charge.frequence === 'trimestriel' ? charge.montant / 3
                    : 0;
                  return (
                    <div
                      key={charge.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        charge.actif
                          ? 'border-border hover:border-border-light bg-background'
                          : 'border-border/50 bg-background/50 opacity-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${charge.actif ? 'bg-warning/10' : 'bg-muted/10'}`}>
                        <Wallet size={16} className={charge.actif ? 'text-warning' : 'text-muted'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{charge.nom}</p>
                          {!charge.actif && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/10 text-muted">Inactif</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                            {CHARGE_CATEGORY_LABELS[charge.categorie]}
                          </span>
                          {charge.fournisseur && (
                            <span className="text-xs text-muted truncate">{charge.fournisseur}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">{charge.montant.toLocaleString('fr-FR')} €</p>
                        <p className="text-[10px] text-muted">
                          {CHARGE_FREQUENCY_LABELS[charge.frequence]}
                          {charge.frequence !== 'ponctuel' && charge.frequence !== 'mensuel' && (
                            <span className="text-muted"> · {Math.round(montantMensuel)} €/mois</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingCharge(charge); setChargeModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-info/10 text-muted hover:text-info transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCharge(charge.id)}
                          className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted text-sm">
              <div className="text-center">
                <Wallet size={36} className="mx-auto mb-2 opacity-40" />
                <p>Aucune charge enregistrée</p>
                <p className="text-xs mt-1 opacity-60">Ajoutez vos abonnements, logiciels, frais récurrents...</p>
                <button
                  onClick={() => { setEditingCharge(null); setChargeModalOpen(true); }}
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                >
                  <Plus size={14} />
                  Ajouter une charge
                </button>
              </div>
            </div>
          )}

          {/* Totals bar */}
          {charges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs text-muted">Charges /mois:</span>
                <span className="text-sm font-bold text-foreground">{Math.round(chargesMensuelles).toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-muted">CA /mois:</span>
                <span className="text-sm font-bold text-foreground">{caMensuel.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${beneficeMensuel >= 0 ? 'bg-success' : 'bg-danger'}`} />
                <span className="text-xs text-muted">Bénéfice:</span>
                <span className={`text-sm font-bold ${beneficeMensuel >= 0 ? 'text-success' : 'text-danger'}`}>
                  {beneficeMensuel >= 0 ? '+' : ''}{Math.round(beneficeMensuel).toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Charges by Category Pie */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Répartition des charges</h3>
          {chargesByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={chargesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chargesByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111113', border: '1px solid #1e1e22', borderRadius: '8px', color: '#fafafa', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                    formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €/mois`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {chargesByCategory.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                      <span className="text-muted text-xs">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground text-xs">{item.value} €/mois</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-60 text-muted text-sm">
              <div className="text-center">
                <TrendingDown size={32} className="mx-auto mb-2 opacity-40" />
                <p>Aucune charge</p>
                <p className="text-xs mt-1 opacity-60">Les catégories apparaitront ici</p>
              </div>
            </div>
          )}
        </div>
      </div>

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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" horizontal={false} />
                  <XAxis type="number" stroke="#52525b" fontSize={12} />
                  <YAxis type="category" dataKey="stage" stroke="#52525b" fontSize={11} width={70} />
                  <Tooltip
                    contentStyle={{ background: '#111113', border: '1px solid #1e1e22', borderRadius: '8px', color: '#fafafa', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                  />
                  <Bar dataKey="count" fill="#818cf8" radius={[0, 6, 6, 0]} />
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

      {/* Charge Modal */}
      <ChargeFormModal
        isOpen={chargeModalOpen}
        onClose={() => { setChargeModalOpen(false); setEditingCharge(null); }}
        onSave={handleSaveCharge}
        charge={editingCharge}
      />
    </div>
  );
}

function ChargeFormModal({ isOpen, onClose, onSave, charge }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (charge: Charge) => void;
  charge: Charge | null;
}) {
  const [form, setForm] = useState<Partial<Charge>>({});

  useEffect(() => {
    if (charge) {
      setForm(charge);
    } else {
      setForm({
        id: generateId(),
        nom: '',
        categorie: 'abonnement',
        montant: 0,
        frequence: 'mensuel',
        dateDebut: new Date().toISOString().split('T')[0],
        actif: true,
        notes: '',
        fournisseur: '',
      });
    }
  }, [charge, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form as Charge);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={charge ? 'Modifier la charge' : 'Nouvelle charge'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1">Nom de la charge</label>
          <input
            type="text"
            required
            value={form.nom || ''}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex: ChatGPT Plus, Vercel Pro, Google Ads..."
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Catégorie</label>
            <select
              value={form.categorie || 'abonnement'}
              onChange={(e) => setForm({ ...form, categorie: e.target.value as ChargeCategory })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              {Object.entries(CHARGE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Fournisseur</label>
            <input
              type="text"
              value={form.fournisseur || ''}
              onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
              placeholder="Ex: OpenAI, Vercel..."
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Montant (€)</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.montant || ''}
              onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Fréquence</label>
            <select
              value={form.frequence || 'mensuel'}
              onChange={(e) => setForm({ ...form, frequence: e.target.value as ChargeFrequency })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              {Object.entries(CHARGE_FREQUENCY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Date de début</label>
            <input
              type="date"
              value={form.dateDebut || ''}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Date de fin (optionnel)</label>
            <input
              type="date"
              value={form.dateFin || ''}
              onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.actif ?? true}
              onChange={(e) => setForm({ ...form, actif: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success" />
          </label>
          <div>
            <p className="text-sm font-medium text-foreground">Charge active</p>
            <p className="text-xs text-muted">Les charges inactives ne sont pas comptabilisées</p>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Informations complémentaires..."
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
          >
            {charge ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
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

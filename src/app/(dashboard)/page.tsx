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
  DollarSign,
  Target,
} from 'lucide-react';
import { getClients, getInvoices, getInteractions, getEvents, getCharges, saveCharge, deleteCharge, generateId } from '@/lib/store';
import { Client, Invoice, Interaction, CalendarEvent, Charge, ChargeCategory, ChargeFrequency, SERVICE_LABELS, CHARGE_CATEGORY_LABELS, CHARGE_FREQUENCY_LABELS } from '@/lib/types';
import Link from 'next/link';
import Modal from '@/components/Modal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const TOOLTIP_STYLE = {
  background: '#0C0C14',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#F5F5F7',
  fontSize: '12px',
  padding: '8px 12px',
};

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
    { name: 'Site Web', value: clients.filter(c => c.servicesSouscrits.includes('site-web')).length, color: '#5e9eff' },
    { name: 'Chatbot', value: clients.filter(c => c.servicesSouscrits.includes('chatbot')).length, color: '#a78bfa' },
    { name: 'Réceptionniste', value: clients.filter(c => c.servicesSouscrits.includes('receptionniste-ia')).length, color: '#34d399' },
    { name: 'Automatisation', value: clients.filter(c => c.servicesSouscrits.includes('automatisation')).length, color: '#fbbf24' },
  ].filter(s => s.value > 0);

  const pipelineData = [
    { stage: 'Lead', count: clients.filter(c => c.pipelineStage === 'premier-contact').length },
    { stage: 'Qualifié', count: clients.filter(c => c.pipelineStage === 'proposition').length },
    { stage: 'Proposition', count: clients.filter(c => c.pipelineStage === 'signe').length },
    { stage: 'Négociation', count: clients.filter(c => c.pipelineStage === 'refuse').length },
    { stage: 'Gagné', count: clients.filter(c => c.pipelineStage === 'perdu').length },
  ];

  const chargesByCategoryColors: Record<ChargeCategory, string> = {
    'abonnement': '#5e9eff',
    'logiciel': '#a78bfa',
    'marketing': '#fbbf24',
    'hebergement': '#60a5fa',
    'telephonie': '#34d399',
    'freelance': '#c084fc',
    'materiel': '#f87171',
    'formation': '#fb7185',
    'autre': '#525252',
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
      case 'appel': return <Phone size={13} />;
      case 'email': return <Mail size={13} />;
      case 'rdv': return <CalIcon size={13} />;
      default: return <Clock size={13} />;
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
    <div className="p-5 lg:p-8 space-y-6 pt-16 lg:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-bold text-[#F5F5F7]">Dashboard</h1>
          <p className="text-[13px] text-white/[0.45] mt-1">Vue d&apos;ensemble de votre activité commerciale</p>
        </div>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-white/[0.45] text-[13px] hover:bg-white/[0.04] transition-colors">
          <Clock size={14} />
          Mis à jour à l&apos;instant
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="border border-white/[0.08] rounded-[20px] p-8 text-center animate-fade-in">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#5e9eff]/10 flex items-center justify-center">
            <Users size={24} className="text-[#5e9eff]" />
          </div>
          <h2 className="text-base font-semibold text-[#F5F5F7] mb-1">Bienvenue sur OpexIA CRM</h2>
          <p className="text-[13px] text-white/[0.45] max-w-md mx-auto mb-5">
            Commencez par ajouter vos premiers clients et prospects pour voir vos statistiques ici.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/clients" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/[0.15] text-white text-[13px] font-semibold transition-colors hover:bg-white/[0.04]">
              <UserPlus size={14} />
              Ajouter un client
            </Link>
            <Link href="/pipeline" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/[0.06] text-white/[0.55] hover:bg-white/[0.04] text-[13px] font-medium transition-colors">
              <GitBranch size={14} />
              Voir le pipeline
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenu Total"
          value={`${caMensuel.toLocaleString('fr-FR')} €`}
          change={totalClients > 0 ? `${totalClients} client${totalClients > 1 ? 's' : ''} actif${totalClients > 1 ? 's' : ''}` : 'Aucun client'}
          positive={caMensuel > 0}
          icon={<DollarSign size={18} />}
          iconBg="bg-[#34d399]/10"
          iconColor="text-[#34d399]"
        />
        <KPICard
          title="Clients Actifs"
          value={totalClients.toString()}
          change={`${clients.length} clients au total`}
          positive={totalClients > 0}
          icon={<Users size={18} />}
          iconBg="bg-[#34d399]/10"
          iconColor="text-[#34d399]"
        />
        <KPICard
          title="Pipeline"
          value={`${(caMensuel * 3).toLocaleString('fr-FR')} €`}
          change={`${clients.filter(c => c.status === 'prospect').length} deals en cours`}
          positive
          icon={<TrendingUp size={18} />}
          iconBg="bg-[#a78bfa]/10"
          iconColor="text-[#a78bfa]"
        />
        <KPICard
          title="Taux de Conversion"
          value={`${tauxConversion}%`}
          change={facturesEnRetard > 0 ? `${facturesEnRetard} factures en retard` : `${facturesEnAttente} en attente`}
          positive={tauxConversion > 0}
          icon={<Target size={18} />}
          iconBg="bg-[#fbbf24]/10"
          iconColor="text-[#fbbf24]"
        />
      </div>

      {/* Charts Row */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Évolution du Revenu</h3>
                <p className="text-[12px] text-white/[0.45]">6 derniers mois</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#F5F5F7]">{caAnnuel.toLocaleString('fr-FR')} €</p>
                <p className="text-[12px] text-[#34d399]">+7.36% ce mois</p>
              </div>
            </div>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5e9eff" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#5e9eff" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="mois" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} dx={-5} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €`, 'CA']}
                    cursor={{ stroke: 'rgba(94,158,255,0.15)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="#5e9eff"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#5e9eff', stroke: '#0C0C14', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60 text-white/20 text-[13px]">
                <div className="text-center">
                  <Receipt size={28} className="mx-auto mb-2 opacity-30" />
                  <p>Ajoutez des factures pour voir le graphique</p>
                  <Link href="/facturation" className="text-[#5e9eff] text-[12px] hover:underline mt-1 inline-block">
                    Aller à la facturation
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
            <h3 className="text-[15px] font-semibold text-[#F5F5F7] mb-1">Pipeline par Étape</h3>
            <p className="text-[12px] text-white/[0.45] mb-4">Répartition des deals</p>
            {clients.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pipelineData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.15)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="stage" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" fill="#5e9eff" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-white/20 text-[13px]">
                <div className="text-center">
                  <GitBranch size={28} className="mx-auto mb-2 opacity-30" />
                  <p>Pipeline vide</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-[#F5F5F7] flex items-center gap-2">
                <Wallet size={16} className="text-[#fbbf24]" />
                Charges & Abonnements
              </h3>
              <p className="text-[12px] text-white/[0.45] mt-0.5">Suivi de vos frais récurrents et ponctuels</p>
            </div>
            <button
              onClick={() => { setEditingCharge(null); setChargeModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.15] text-white text-[12px] font-semibold transition-colors hover:bg-white/[0.04]"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>

          {activeCharges.length > 0 ? (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
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
                          ? 'border-white/[0.04] hover:border-white/[0.08] bg-black/10'
                          : 'border-white/[0.03] bg-transparent opacity-40'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${charge.actif ? 'bg-[#fbbf24]/10' : 'bg-white/[0.03]'}`}>
                        <Wallet size={14} className={charge.actif ? 'text-[#fbbf24]' : 'text-white/20'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-medium text-[#F5F5F7] truncate">{charge.nom}</p>
                          {!charge.actif && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.03] text-white/25">Inactif</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#5e9eff]/10 text-[#5e9eff] text-[10px] font-medium">
                            {CHARGE_CATEGORY_LABELS[charge.categorie]}
                          </span>
                          {charge.fournisseur && (
                            <span className="text-[11px] text-white/[0.3] truncate">{charge.fournisseur}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-semibold text-[#F5F5F7]">{charge.montant.toLocaleString('fr-FR')} €</p>
                        <p className="text-[10px] text-white/[0.3]">
                          {CHARGE_FREQUENCY_LABELS[charge.frequence]}
                          {charge.frequence !== 'ponctuel' && charge.frequence !== 'mensuel' && (
                            <span> · {Math.round(montantMensuel)} €/mois</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => { setEditingCharge(charge); setChargeModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/20 hover:text-[#5e9eff] transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCharge(charge.id)}
                          className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.06)] text-white/20 hover:text-[#f87171] transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-44 text-white/[0.3] text-[13px]">
              <div className="text-center">
                <Wallet size={28} className="mx-auto mb-2 opacity-30" />
                <p>Aucune charge enregistrée</p>
                <button
                  onClick={() => { setEditingCharge(null); setChargeModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl border border-white/[0.15] text-white text-[12px] font-semibold transition-colors hover:bg-white/[0.04]"
                >
                  <Plus size={14} />
                  Ajouter une charge
                </button>
              </div>
            </div>
          )}

          {charges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.04] flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                <span className="text-[11px] text-white/[0.3]">Charges /mois:</span>
                <span className="text-[13px] font-medium text-[#F5F5F7]">{Math.round(chargesMensuelles).toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#5e9eff]" />
                <span className="text-[11px] text-white/[0.3]">CA /mois:</span>
                <span className="text-[13px] font-medium text-[#F5F5F7]">{caMensuel.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${beneficeMensuel >= 0 ? 'bg-[#34d399]' : 'bg-[#f87171]'}`} />
                <span className="text-[11px] text-white/[0.3]">Bénéfice:</span>
                <span className={`text-[13px] font-medium ${beneficeMensuel >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                  {beneficeMensuel >= 0 ? '+' : ''}{Math.round(beneficeMensuel).toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7] mb-1">Répartition des charges</h3>
          <p className="text-[12px] text-white/[0.45] mb-4">Par catégorie</p>
          {chargesByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={chargesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="rgba(12,12,20,0.8)"
                    strokeWidth={2}
                    cornerRadius={4}
                  >
                    {chargesByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: '#F5F5F7' }}
                    formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €/mois`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {chargesByCategory.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-white/[0.45]">{item.name}</span>
                    </div>
                    <span className="font-medium text-[#F5F5F7] tabular-nums">{item.value} €/mois</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-56 text-white/[0.3] text-[13px]">
              <div className="text-center">
                <TrendingDown size={28} className="mx-auto mb-2 opacity-30" />
                <p>Aucune charge</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7] mb-1">Services souscrits</h3>
          <p className="text-[12px] text-white/[0.45] mb-4">Répartition</p>
          {serviceDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="rgba(12,12,20,0.8)"
                    strokeWidth={2}
                    cornerRadius={4}
                  >
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#F5F5F7' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {serviceDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-white/[0.45]">{item.name}</span>
                    </div>
                    <span className="font-medium text-[#F5F5F7] tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-56 text-white/[0.3] text-[13px]">
              <div className="text-center">
                <Receipt size={28} className="mx-auto mb-2 opacity-30" />
                <p>Aucun service souscrit</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7] mb-4">Activité récente</h3>
          {recentInteractions.length > 0 ? (
            <div className="space-y-2">
              {recentInteractions.map((inter) => {
                const client = clients.find(c => c.id === inter.clientId);
                return (
                  <div key={inter.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className="p-2 rounded-xl bg-[#a78bfa]/10 text-[#a78bfa] mt-0.5">
                      {interactionIcon(inter.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#F5F5F7] truncate">{inter.sujet}</p>
                      <p className="text-[11px] text-white/[0.3] truncate">{client?.entreprise}</p>
                      <p className="text-[11px] text-white/[0.2] mt-0.5">
                        {new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/[0.3] text-[13px]">
              <div className="text-center">
                <Mail size={28} className="mx-auto mb-2 opacity-30" />
                <p>Aucune activité</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Prochains RDV</h3>
            <Link href="/calendly" className="text-[12px] text-[#5e9eff] hover:text-[#6eaaff]">Voir tout</Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 rounded-xl border border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'rdv' ? 'bg-[#5e9eff]' :
                      event.type === 'deadline' ? 'bg-[#f87171]' :
                      'bg-[#fbbf24]'
                    }`} />
                    <p className="text-[13px] font-medium text-[#F5F5F7] truncate">{event.titre}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/[0.3]">
                    <span>{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <span>{event.heure}</span>
                    <span>{event.duree} min</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/[0.3] text-[13px]">
              <div className="text-center">
                <CalIcon size={28} className="mx-auto mb-2 opacity-30" />
                <p>Aucun RDV à venir</p>
                <Link href="/calendly" className="text-[#5e9eff] text-[12px] hover:underline mt-1 inline-block">
                  Planifier un événement
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Clients */}
      <div className="bg-black/20 border border-white/[0.04] rounded-[14px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7]">Derniers clients / prospects</h3>
          <Link href="/clients" className="text-[12px] text-[#5e9eff] hover:text-[#6eaaff]">
            {clients.length > 0 ? 'Voir tous' : 'Ajouter'}
          </Link>
        </div>
        {clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left border-b border-white/[0.06]">
                  <th className="pb-3 font-semibold text-white/[0.3] text-[10px] uppercase tracking-[1px]">Nom</th>
                  <th className="pb-3 font-semibold text-white/[0.3] text-[10px] uppercase tracking-[1px]">Entreprise</th>
                  <th className="pb-3 font-semibold text-white/[0.3] text-[10px] uppercase tracking-[1px] hidden sm:table-cell">Services</th>
                  <th className="pb-3 font-semibold text-white/[0.3] text-[10px] uppercase tracking-[1px] hidden md:table-cell">Mensuel</th>
                  <th className="pb-3 font-semibold text-white/[0.3] text-[10px] uppercase tracking-[1px]">Statut</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 5).map((client) => (
                  <tr key={client.id} className="border-b border-white/[0.03]">
                    <td className="py-3">
                      <Link href={`/clients/${client.id}`} className="text-[#F5F5F7] hover:text-[#5e9eff] font-medium">
                        {client.prenom} {client.nom}
                      </Link>
                    </td>
                    <td className="py-3 text-white/[0.45]">{client.entreprise}</td>
                    <td className="py-3 hidden sm:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {client.servicesSouscrits.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-[#5e9eff]/10 text-[#5e9eff] text-[10px]">
                            {SERVICE_LABELS[s]}
                          </span>
                        ))}
                        {client.servicesSouscrits.length === 0 && (
                          <span className="text-[10px] text-white/15">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell font-medium text-[#F5F5F7]">
                      {client.montantMensuel > 0 ? `${client.montantMensuel} €` : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        client.status === 'client' ? 'bg-[#34d399]/15 text-[#34d399]' :
                        client.status === 'prospect' ? 'bg-[#5e9eff]/15 text-[#5e9eff]' :
                        'bg-[#f87171]/15 text-[#f87171]'
                      }`}>
                        {client.status === 'client' ? 'Actif' : client.status === 'prospect' ? 'Prospect' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-white/[0.3]">
            <Users size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-[13px]">Aucun contact pour le moment</p>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl border border-white/[0.15] text-white text-[12px] font-semibold transition-colors hover:bg-white/[0.04]"
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
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] text-white/[0.45] mb-1">Nom de la charge</label>
          <input
            type="text"
            required
            value={form.nom || ''}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex: ChatGPT Plus, Vercel Pro, Google Ads..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/[0.45] mb-1">Catégorie</label>
            <select
              value={form.categorie || 'abonnement'}
              onChange={(e) => setForm({ ...form, categorie: e.target.value as ChargeCategory })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none"
            >
              {Object.entries(CHARGE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-white/[0.45] mb-1">Fournisseur</label>
            <input
              type="text"
              value={form.fournisseur || ''}
              onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
              placeholder="Ex: OpenAI, Vercel..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/[0.45] mb-1">Montant (€)</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.montant || ''}
              onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/[0.45] mb-1">Fréquence</label>
            <select
              value={form.frequence || 'mensuel'}
              onChange={(e) => setForm({ ...form, frequence: e.target.value as ChargeFrequency })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none"
            >
              {Object.entries(CHARGE_FREQUENCY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/[0.45] mb-1">Date de début</label>
            <input
              type="date"
              value={form.dateDebut || ''}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/[0.45] mb-1">Date de fin (optionnel)</label>
            <input
              type="date"
              value={form.dateFin || ''}
              onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/10 border border-white/[0.04]">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.actif ?? true}
              onChange={(e) => setForm({ ...form, actif: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-white/[0.08] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#34d399]" />
          </label>
          <div>
            <p className="text-[13px] font-medium text-[#F5F5F7]">Charge active</p>
            <p className="text-[11px] text-white/[0.3]">Les charges inactives ne sont pas comptabilisées</p>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-white/[0.45] mb-1">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Informations complémentaires..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/[0.06] text-[#F5F5F7] text-[13px] focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/[0.06] text-white/[0.45] hover:text-white/60 text-[13px] transition-colors hover:bg-white/[0.02]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/[0.15] text-white text-[13px] font-semibold transition-colors hover:bg-white/[0.04]"
          >
            {charge ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function KPICard({ title, value, change, positive, icon, iconBg, iconColor }: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="border border-white/[0.08] rounded-[20px] p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-[42px] h-[42px] rounded-2xl ${iconBg} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-white/[0.2]" />
      </div>
      <p className="text-2xl font-bold text-[#F5F5F7]">{value}</p>
      <p className="text-[12px] text-white/[0.55] mt-0.5">{title}</p>
      <p className="text-[12px] text-white/[0.35] mt-0.5">{change}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-5 lg:p-8 space-y-6 pt-16 lg:pt-8">
      <div className="h-9 w-48 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[173px] animate-pulse rounded-[20px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 animate-pulse rounded-[14px]" />
        <div className="h-80 animate-pulse rounded-[14px]" />
      </div>
    </div>
  );
}

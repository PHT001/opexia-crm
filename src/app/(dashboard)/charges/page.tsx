'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Wallet,
  Trash2,
  Edit3,
  Search,
  Filter,
  TrendingDown,
  CreditCard,
  BarChart3,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { getCharges, saveCharge, deleteCharge, getClients, generateId } from '@/lib/store';
import { Charge, ChargeCategory, ChargeFrequency, CHARGE_CATEGORY_LABELS, CHARGE_FREQUENCY_LABELS } from '@/lib/types';
import Modal from '@/components/Modal';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// WorkOS/AuthKit palette
const CATEGORY_COLORS: Record<ChargeCategory, string> = {
  'abonnement': '#6c5ce7',
  'logiciel': '#a78bfa',
  'marketing': '#fbbf24',
  'hebergement': '#60a5fa',
  'telephonie': '#34d399',
  'freelance': '#c084fc',
  'materiel': '#f87171',
  'formation': '#fb7185',
  'autre': '#525252',
};

const TOOLTIP_STYLE = {
  background: '#0f0f0f',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#ededed',
  fontSize: '12px',
  padding: '8px 12px',
};

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ChargeCategory | 'toutes'>('toutes');
  const [filterActive, setFilterActive] = useState<'toutes' | 'actives' | 'inactives'>('toutes');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [mounted, setMounted] = useState(false);
  const [caMensuel, setCaMensuel] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const [ch, clients] = await Promise.all([getCharges(), getClients()]);
      setCharges(ch);
      const ca = clients.filter(c => c.status === 'client').reduce((sum, c) => sum + c.montantMensuel, 0);
      setCaMensuel(ca);
      setMounted(true);
    };
    loadData();
  }, []);

  const refresh = async () => setCharges(await getCharges());

  const getMontantMensuel = (charge: Charge) => {
    switch (charge.frequence) {
      case 'mensuel': return charge.montant;
      case 'annuel': return charge.montant / 12;
      case 'trimestriel': return charge.montant / 3;
      case 'ponctuel': return 0;
      default: return 0;
    }
  };

  const filtered = charges.filter(c => {
    const matchSearch = search === '' ||
      `${c.nom} ${c.fournisseur || ''} ${c.notes || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'toutes' || c.categorie === filterCategory;
    const matchActive = filterActive === 'toutes' || (filterActive === 'actives' ? c.actif : !c.actif);
    return matchSearch && matchCategory && matchActive;
  });

  const activeCharges = charges.filter(c => c.actif);
  const totalMensuel = activeCharges.reduce((sum, c) => sum + getMontantMensuel(c), 0);
  const totalAnnuel = totalMensuel * 12;
  const beneficeMensuel = caMensuel - totalMensuel;

  // Répartition par catégorie
  const chargesByCategory = Object.entries(CHARGE_CATEGORY_LABELS)
    .map(([key, label]) => {
      const catCharges = activeCharges.filter(c => c.categorie === key);
      const total = catCharges.reduce((sum, c) => sum + getMontantMensuel(c), 0);
      return { name: label, value: Math.round(total * 100) / 100, color: CATEGORY_COLORS[key as ChargeCategory], count: catCharges.length };
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Répartition par fréquence
  const chargesByFrequency = Object.entries(CHARGE_FREQUENCY_LABELS)
    .map(([key, label]) => {
      const freqCharges = activeCharges.filter(c => c.frequence === key);
      return { name: label, count: freqCharges.length, total: freqCharges.reduce((sum, c) => sum + c.montant, 0) };
    })
    .filter(c => c.count > 0);

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette charge ?')) {
      await deleteCharge(id);
      await refresh();
    }
  };

  const handleToggleActive = async (charge: Charge) => {
    await saveCharge({ ...charge, actif: !charge.actif });
    await refresh();
  };

  const handleSave = async (charge: Charge) => {
    await saveCharge(charge);
    await refresh();
    setModalOpen(false);
    setEditingCharge(null);
  };

  if (!mounted) return <div className="p-6 pt-16 lg:pt-6"><div className="h-8 w-48 rounded-xl animate-pulse" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Charges & Abonnements</h1>
          <p className="text-sm text-white/40 mt-1">{charges.length} charge{charges.length > 1 ? 's' : ''} au total · {activeCharges.length} active{activeCharges.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditingCharge(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6df0] text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nouvelle charge
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Total /mois</span>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)' }}>
              <Wallet size={18} className="text-[#fbbf24]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white/90">{Math.round(totalMensuel).toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-white/25 mt-1">{activeCharges.length} charge{activeCharges.length > 1 ? 's' : ''} active{activeCharges.length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Total /an</span>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)' }}>
              <TrendingDown size={18} className="text-[#f87171]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white/90">{Math.round(totalAnnuel).toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-white/25 mt-1">Projection annuelle</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 font-medium uppercase tracking-wide">CA /mois</span>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(108,92,231,0.08)' }}>
              <BarChart3 size={18} className="text-[#6c5ce7]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white/90">{caMensuel.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-white/25 mt-1">Revenus récurrents</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 font-medium uppercase tracking-wide">Bénéfice /mois</span>
            <div className="p-2 rounded-xl" style={{ background: beneficeMensuel >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)' }}>
              <CreditCard size={18} className={beneficeMensuel >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${beneficeMensuel >= 0 ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
            {beneficeMensuel >= 0 ? '+' : ''}{Math.round(beneficeMensuel).toLocaleString('fr-FR')} €
          </p>
          <p className="text-xs text-white/25 mt-1">{beneficeMensuel >= 0 ? 'Rentable' : 'Déficitaire'}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white/90 mb-4">Répartition par catégorie</h3>
          {chargesByCategory.length > 0 ? (
            <div className="flex items-start gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={chargesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="rgba(5,5,5,0.8)"
                    strokeWidth={2}
                    cornerRadius={6}
                  >
                    {chargesByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: '#ededed' }}
                    formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €/mois`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5 pt-2">
                {chargesByCategory.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-[11px] text-white/40">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-white/90 tabular-nums">{item.value} €</span>
                      <span className="text-[10px] text-white/25 ml-1">({item.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/25 text-sm">
              <p>Aucune charge active</p>
            </div>
          )}
        </div>

        {/* By Frequency */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white/90 mb-4">Par fréquence de paiement</h3>
          {chargesByFrequency.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chargesByFrequency} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €`, 'Total']}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="total" fill="#6c5ce7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/25 text-sm">
              <p>Aucune charge active</p>
            </div>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            placeholder="Rechercher une charge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm placeholder:text-white/25 focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ChargeCategory | 'toutes')}
          className="px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
        >
          <option value="toutes">Toutes les catégories</option>
          {Object.entries(CHARGE_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as 'toutes' | 'actives' | 'inactives')}
          className="px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
        >
          <option value="toutes">Toutes</option>
          <option value="actives">Actives</option>
          <option value="inactives">Inactives</option>
        </select>
      </div>

      {/* Charges List */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/25 border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-[11px] font-medium">Charge</th>
                <th className="px-4 py-3 text-[11px] font-medium hidden md:table-cell">Catégorie</th>
                <th className="px-4 py-3 text-[11px] font-medium hidden lg:table-cell">Fournisseur</th>
                <th className="px-4 py-3 text-[11px] font-medium">Montant</th>
                <th className="px-4 py-3 text-[11px] font-medium hidden sm:table-cell">Fréquence</th>
                <th className="px-4 py-3 text-[11px] font-medium hidden lg:table-cell">Coût /mois</th>
                <th className="px-4 py-3 text-[11px] font-medium">Statut</th>
                <th className="px-4 py-3 text-[11px] font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => {
                  if (a.actif && !b.actif) return -1;
                  if (!a.actif && b.actif) return 1;
                  return getMontantMensuel(b) - getMontantMensuel(a);
                })
                .map((charge, i) => (
                <tr
                  key={charge.id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors animate-fade-in ${!charge.actif ? 'opacity-50' : ''}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white/90">{charge.nom}</p>
                    {charge.notes && <p className="text-xs text-white/25 truncate max-w-[200px]">{charge.notes}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: CATEGORY_COLORS[charge.categorie] + '18',
                      color: CATEGORY_COLORS[charge.categorie],
                    }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[charge.categorie] }} />
                      {CHARGE_CATEGORY_LABELS[charge.categorie]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 hidden lg:table-cell">{charge.fournisseur || '—'}</td>
                  <td className="px-4 py-3 font-bold text-white/90">{charge.montant.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-white/40">{CHARGE_FREQUENCY_LABELS[charge.frequence]}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-medium text-white/90">
                      {charge.frequence === 'ponctuel' ? '—' : `${Math.round(getMontantMensuel(charge)).toLocaleString('fr-FR')} €`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(charge)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        charge.actif
                          ? 'bg-[rgba(52,211,153,0.1)] text-[#34d399] hover:bg-[rgba(52,211,153,0.15)]'
                          : 'bg-white/[0.04] text-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      {charge.actif ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {charge.actif ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingCharge(charge); setModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-[rgba(108,92,231,0.1)] text-white/25 hover:text-[#6c5ce7] transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(charge.id)}
                        className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.1)] text-white/25 hover:text-[#f87171] transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/25">
            <Wallet size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucune charge trouvée</p>
            {charges.length === 0 && (
              <button
                onClick={() => { setEditingCharge(null); setModalOpen(true); }}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6df0] text-white text-xs font-medium transition-colors"
              >
                <Plus size={14} />
                Ajouter votre première charge
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <ChargeFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCharge(null); }}
        onSave={handleSave}
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
          <label className="block text-[11px] text-white/40 mb-1">Nom de la charge</label>
          <input
            type="text"
            required
            value={form.nom || ''}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex: ChatGPT Plus, Vercel Pro, Google Ads..."
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Catégorie</label>
            <select
              value={form.categorie || 'abonnement'}
              onChange={(e) => setForm({ ...form, categorie: e.target.value as ChargeCategory })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
            >
              {Object.entries(CHARGE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Fournisseur</label>
            <input
              type="text"
              value={form.fournisseur || ''}
              onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
              placeholder="Ex: OpenAI, Vercel..."
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Montant (€)</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.montant || ''}
              onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Fréquence</label>
            <select
              value={form.frequence || 'mensuel'}
              onChange={(e) => setForm({ ...form, frequence: e.target.value as ChargeFrequency })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
            >
              {Object.entries(CHARGE_FREQUENCY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Date de début</label>
            <input
              type="date"
              value={form.dateDebut || ''}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Date de fin (optionnel)</label>
            <input
              type="date"
              value={form.dateFin || ''}
              onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.actif ?? true}
              onChange={(e) => setForm({ ...form, actif: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/[0.1] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#34d399]" />
          </label>
          <div>
            <p className="text-sm font-medium text-white/90">Charge active</p>
            <p className="text-xs text-white/25">Les charges inactives ne sont pas comptabilisées</p>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-white/40 mb-1">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Informations complémentaires..."
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none focus:border-[rgba(108,92,231,0.5)] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/90 text-sm transition-colors hover:bg-white/[0.03]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6df0] text-white text-sm font-medium transition-colors"
          >
            {charge ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

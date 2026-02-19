'use client';

import { useEffect, useState } from 'react';
import {
  Receipt, Search, Plus, TrendingUp, Clock, AlertTriangle, CheckCircle,
  Download, Filter,
} from 'lucide-react';
import { getInvoices, getClients, saveInvoice, generateId } from '@/lib/store';
import { Invoice, Client, InvoiceStatus, INVOICE_STATUS_LABELS } from '@/lib/types';
import Modal from '@/components/Modal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function FacturationPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'tous'>('tous');
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [inv, cl] = await Promise.all([getInvoices(), getClients()]);
      setInvoices(inv);
      setClients(cl);
      setMounted(true);
    };
    loadData();
  }, []);

  const refresh = async () => setInvoices(await getInvoices());

  const getClientName = (clientId: string) => {
    const c = clients.find(cl => cl.id === clientId);
    return c ? c.entreprise : 'Inconnu';
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = search === '' ||
      `${inv.numero} ${inv.description} ${getClientName(inv.clientId)}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'tous' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission));

  const totalPayees = invoices.filter(i => i.status === 'payee').reduce((s, i) => s + i.montant, 0);
  const totalEnAttente = invoices.filter(i => i.status === 'en-attente').reduce((s, i) => s + i.montant, 0);
  const totalEnRetard = invoices.filter(i => i.status === 'en-retard').reduce((s, i) => s + i.montant, 0);

  // Monthly revenue chart
  const monthlyData: Record<string, number> = {};
  invoices.filter(i => i.status === 'payee').forEach(inv => {
    const m = inv.mois;
    monthlyData[m] = (monthlyData[m] || 0) + inv.montant;
  });
  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, montant]) => ({
      mois: new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      montant,
    }));

  if (!mounted) return <div className="p-6 pt-16 lg:pt-6"><div className="h-8 w-48 bg-card rounded animate-pulse" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
          <p className="text-sm text-muted mt-1">{invoices.length} factures au total</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nouvelle facture
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-success/10"><CheckCircle size={16} className="text-success" /></div>
            <span className="text-xs text-muted">Payées</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalPayees.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-warning/10"><Clock size={16} className="text-warning" /></div>
            <span className="text-xs text-muted">En attente</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalEnAttente.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-danger/10"><AlertTriangle size={16} className="text-danger" /></div>
            <span className="text-xs text-muted">En retard</span>
          </div>
          <p className="text-xl font-bold text-danger">{totalEnRetard.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-primary/10"><TrendingUp size={16} className="text-primary" /></div>
            <span className="text-xs text-muted">CA Total</span>
          </div>
          <p className="text-xl font-bold gradient-text">{(totalPayees + totalEnAttente).toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenus mensuels (payés)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
              <XAxis dataKey="mois" stroke="#52525b" fontSize={12} />
              <YAxis stroke="#52525b" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#111113', border: '1px solid #1e1e22', borderRadius: '8px', color: '#fafafa', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                formatter={(value: unknown) => [`${Number(value).toLocaleString('fr-FR')} €`, 'Revenu']}
              />
              <Bar dataKey="montant" fill="#818cf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher une facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | 'tous')}
          className="px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary"
        >
          <option value="tous">Tous les statuts</option>
          <option value="payee">Payées</option>
          <option value="en-attente">En attente</option>
          <option value="en-retard">En retard</option>
          <option value="annulee">Annulées</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border bg-sidebar">
                <th className="px-4 py-3 font-medium">N° Facture</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Description</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Émission</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Échéance</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="border-b border-border/50 hover:bg-card-hover transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary">{inv.numero}</td>
                  <td className="px-4 py-3 font-medium">{getClientName(inv.clientId)}</td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell truncate max-w-[200px]">{inv.description}</td>
                  <td className="px-4 py-3 font-bold">{inv.montant.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-muted text-xs hidden md:table-cell">
                    {new Date(inv.dateEmission).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs hidden md:table-cell">
                    {new Date(inv.dateEcheance).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      inv.status === 'payee' ? 'bg-success/15 text-success border border-success/30' :
                      inv.status === 'en-attente' ? 'bg-warning/15 text-warning border border-warning/30' :
                      inv.status === 'en-retard' ? 'bg-danger/15 text-danger border border-danger/30' :
                      'bg-muted/15 text-muted'
                    }`}>
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            <Receipt size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucune facture trouvée</p>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      <NewInvoiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        onSave={() => { refresh(); setModalOpen(false); }}
      />
    </div>
  );
}

function NewInvoiceModal({ isOpen, onClose, clients, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    clientId: '',
    montant: 0,
    description: '',
    dateEcheance: '',
    status: 'en-attente' as InvoiceStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const numero = `OPEX-${now.getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
    await saveInvoice({
      id: generateId(),
      numero,
      clientId: form.clientId,
      montant: form.montant,
      description: form.description,
      status: form.status,
      dateEmission: now.toISOString().split('T')[0],
      dateEcheance: form.dateEcheance,
      mois: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    });
    onSave();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle facture">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1">Client</label>
          <select
            required
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Sélectionner un client</option>
            {clients.filter(c => c.status === 'client').map(c => (
              <option key={c.id} value={c.id}>{c.entreprise}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Montant (€)</label>
          <input
            type="number"
            required
            min={0}
            value={form.montant || ''}
            onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Description</label>
          <input
            type="text"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Date d&apos;échéance</label>
            <input
              type="date"
              required
              value={form.dateEcheance}
              onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Statut</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="en-attente">En attente</option>
              <option value="payee">Payée</option>
              <option value="en-retard">En retard</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-foreground transition-colors">
            Annuler
          </button>
          <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
            Créer la facture
          </button>
        </div>
      </form>
    </Modal>
  );
}

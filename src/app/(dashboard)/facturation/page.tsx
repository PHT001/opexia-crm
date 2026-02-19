'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Receipt, Search, Plus, TrendingUp, Clock, AlertTriangle, CheckCircle,
  Download, FileText, ArrowRightLeft, Trash2, X, ChevronDown, Package, Check,
} from 'lucide-react';
import {
  getInvoices, getClients, saveInvoice, deleteInvoice,
  getAllDevis, saveDevis, deleteDevis, generateId,
} from '@/lib/store';
import {
  Invoice, Client, InvoiceStatus, INVOICE_STATUS_LABELS,
  Devis, DevisStatus, DEVIS_STATUS_LABELS, DocumentLigne,
} from '@/lib/types';
import { generatePDF } from '@/lib/pdf';
import Modal from '@/components/Modal';

// ========== HELPERS ==========
const TVA_RATE = 20;

function emptyLigne(): DocumentLigne {
  return { description: '', quantite: 1, prixUnitaire: 0, tva: TVA_RATE };
}

function calcLigneTotal(l: DocumentLigne): number {
  return l.quantite * l.prixUnitaire;
}

function calcTotalHT(lignes: DocumentLigne[]): number {
  return lignes.reduce((s, l) => s + calcLigneTotal(l), 0);
}

function calcTotalTVA(lignes: DocumentLigne[]): number {
  return lignes.reduce((s, l) => s + calcLigneTotal(l) * (l.tva / 100), 0);
}

function nextNumero(prefix: string, existing: string[]): string {
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;
  const nums = existing
    .filter(n => n.startsWith(yearPrefix))
    .map(n => parseInt(n.replace(yearPrefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${yearPrefix}${String(next).padStart(3, '0')}`;
}

// ========== STATUS BADGE ==========
function StatusBadge({ status, type }: { status: string; type: 'facture' | 'devis' }) {
  const colors: Record<string, string> = {
    'payee': 'bg-[rgba(52,211,153,0.08)] text-[#34d399] border-[rgba(52,211,153,0.2)]',
    'en-attente': 'bg-[rgba(251,191,36,0.08)] text-[#fbbf24] border-[rgba(251,191,36,0.2)]',
    'en-retard': 'bg-[rgba(248,113,113,0.08)] text-[#f87171] border-[rgba(248,113,113,0.2)]',
    'annulee': 'bg-white/[0.03] text-white/30 border-white/[0.08]',
    'brouillon': 'bg-white/[0.03] text-white/30 border-white/[0.08]',
    'envoye': 'bg-[rgba(96,165,250,0.08)] text-[#60a5fa] border-[rgba(96,165,250,0.2)]',
    'accepte': 'bg-[rgba(52,211,153,0.08)] text-[#34d399] border-[rgba(52,211,153,0.2)]',
    'refuse': 'bg-[rgba(248,113,113,0.08)] text-[#f87171] border-[rgba(248,113,113,0.2)]',
    'expire': 'bg-[rgba(251,191,36,0.08)] text-[#fbbf24] border-[rgba(251,191,36,0.2)]',
  };
  const label = type === 'facture'
    ? INVOICE_STATUS_LABELS[status as InvoiceStatus]
    : DEVIS_STATUS_LABELS[status as DevisStatus];

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-white/[0.03] text-white/30'}`}>
      {label || status}
    </span>
  );
}

// ========== MAIN PAGE ==========
export default function FacturationPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<'factures' | 'devis'>('factures');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'facture' | 'devis'>('facture');
  const [mounted, setMounted] = useState(false);
  const [devisError, setDevisError] = useState(false);

  const loadData = useCallback(async () => {
    const [inv, cl] = await Promise.all([getInvoices(), getClients()]);
    setInvoices(inv);
    setClients(cl);
    try {
      const d = await getAllDevis();
      setDevisList(d);
    } catch {
      setDevisError(true);
      setDevisList([]);
    }
    setMounted(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const refresh = async () => {
    const [inv] = await Promise.all([getInvoices()]);
    setInvoices(inv);
    try {
      const d = await getAllDevis();
      setDevisList(d);
      setDevisError(false);
    } catch {
      setDevisError(true);
    }
  };

  const getClientName = (clientId: string) => {
    const c = clients.find(cl => cl.id === clientId);
    return c ? c.entreprise : 'Inconnu';
  };

  const getClient = (clientId: string) => clients.find(cl => cl.id === clientId);

  // Open modal
  const openModal = (type: 'facture' | 'devis') => {
    setModalType(type);
    setModalOpen(true);
  };

  // Convert devis to invoice
  const convertDevisToInvoice = async (devis: Devis) => {
    const now = new Date();
    const echeance = new Date(now);
    echeance.setDate(echeance.getDate() + 30);
    const numero = nextNumero('FAC', invoices.map(i => i.numero));

    const invoice: Invoice = {
      id: generateId(),
      clientId: devis.clientId,
      numero,
      montant: devis.montantTTC,
      status: 'en-attente',
      dateEmission: now.toISOString().split('T')[0],
      dateEcheance: echeance.toISOString().split('T')[0],
      description: `Facture issue du devis ${devis.numero}`,
      mois: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      lignes: devis.lignes,
      montantHT: devis.montantHT,
      montantTTC: devis.montantTTC,
      devisId: devis.id,
    };

    await saveInvoice(invoice);
    // Update devis status to accepte
    await saveDevis({ ...devis, status: 'accepte' });
    await refresh();
  };

  // Update devis status
  const updateDevisStatus = async (devis: Devis, status: DevisStatus) => {
    await saveDevis({ ...devis, status });
    await refresh();
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoice: Invoice, status: InvoiceStatus) => {
    await saveInvoice({ ...invoice, status });
    await refresh();
  };

  // Download PDF
  const downloadPDF = (type: 'devis' | 'facture', doc: Devis | Invoice) => {
    const client = getClient(doc.clientId);
    if (!client) return;
    const lignes = ('lignes' in doc && doc.lignes) ? doc.lignes : [];
    generatePDF(type, doc, client, lignes);
  };

  // ===== FACTURES TAB =====
  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = search === '' ||
      `${inv.numero} ${inv.description} ${getClientName(inv.clientId)}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'tous' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission));

  // ===== DEVIS TAB =====
  const filteredDevis = devisList.filter(d => {
    const matchSearch = search === '' ||
      `${d.numero} ${d.notes} ${getClientName(d.clientId)}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'tous' || d.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));

  // Stats
  const totalPayees = invoices.filter(i => i.status === 'payee').reduce((s, i) => s + (i.montantTTC || i.montant), 0);
  const totalEnAttente = invoices.filter(i => i.status === 'en-attente').reduce((s, i) => s + (i.montantTTC || i.montant), 0);
  const totalEnRetard = invoices.filter(i => i.status === 'en-retard').reduce((s, i) => s + (i.montantTTC || i.montant), 0);
  const totalDevisBrouillon = devisList.filter(d => d.status === 'brouillon').length;
  const totalDevisEnvoye = devisList.filter(d => d.status === 'envoye').length;
  const totalDevisAccepte = devisList.filter(d => d.status === 'accepte').reduce((s, d) => s + d.montantTTC, 0);

  if (!mounted) return <div className="p-6 pt-16 lg:pt-6"><div className="h-8 w-48 bg-white/[0.02] rounded animate-pulse" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white/90">Facturation</h1>
          <p className="text-sm text-white/30 mt-1">
            {invoices.length} factures &middot; {devisList.length} devis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal('devis')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#6c5ce7] text-[#a78bfa] hover:bg-[rgba(108,92,231,0.08)] text-sm font-medium transition-colors"
          >
            <FileText size={16} />
            Nouveau devis
          </button>
          <button
            onClick={() => openModal('facture')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6df0] text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Stats */}
      {activeTab === 'factures' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[rgba(52,211,153,0.08)]"><CheckCircle size={16} className="text-[#34d399]" /></div>
              <span className="text-xs text-white/40">Pay&eacute;es</span>
            </div>
            <p className="text-xl font-bold text-white/90">{totalPayees.toLocaleString('fr-FR')} &euro;</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[rgba(251,191,36,0.08)]"><Clock size={16} className="text-[#fbbf24]" /></div>
              <span className="text-xs text-white/40">En attente</span>
            </div>
            <p className="text-xl font-bold text-white/90">{totalEnAttente.toLocaleString('fr-FR')} &euro;</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[rgba(248,113,113,0.08)]"><AlertTriangle size={16} className="text-[#f87171]" /></div>
              <span className="text-xs text-white/40">En retard</span>
            </div>
            <p className="text-xl font-bold text-[#f87171]">{totalEnRetard.toLocaleString('fr-FR')} &euro;</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[rgba(108,92,231,0.08)]"><TrendingUp size={16} className="text-[#a78bfa]" /></div>
              <span className="text-xs text-white/40">CA Total</span>
            </div>
            <p className="text-xl font-bold text-[#a78bfa]">{(totalPayees + totalEnAttente).toLocaleString('fr-FR')} &euro;</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/[0.03]"><FileText size={16} className="text-white/30" /></div>
              <span className="text-xs text-white/40">Brouillons</span>
            </div>
            <p className="text-xl font-bold text-white/90">{totalDevisBrouillon}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[rgba(96,165,250,0.08)]"><Clock size={16} className="text-[#60a5fa]" /></div>
              <span className="text-xs text-white/40">Envoy&eacute;s</span>
            </div>
            <p className="text-xl font-bold text-white/90">{totalDevisEnvoye}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[rgba(52,211,153,0.08)]"><CheckCircle size={16} className="text-[#34d399]" /></div>
              <span className="text-xs text-white/40">Accept&eacute;s (TTC)</span>
            </div>
            <p className="text-xl font-bold text-[#a78bfa]">{totalDevisAccepte.toLocaleString('fr-FR')} &euro;</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('factures'); setFilterStatus('tous'); setSearch(''); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'factures'
              ? 'bg-white/[0.06] text-white/90 shadow-sm'
              : 'text-white/30 hover:text-white/90'
          }`}
        >
          <Receipt size={14} className="inline mr-2" />
          Factures ({invoices.length})
        </button>
        <button
          onClick={() => { setActiveTab('devis'); setFilterStatus('tous'); setSearch(''); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'devis'
              ? 'bg-white/[0.06] text-white/90 shadow-sm'
              : 'text-white/30 hover:text-white/90'
          }`}
        >
          <FileText size={14} className="inline mr-2" />
          Devis ({devisList.length})
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder={activeTab === 'factures' ? 'Rechercher une facture...' : 'Rechercher un devis...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm placeholder:text-white/25 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
        >
          <option value="tous">Tous les statuts</option>
          {activeTab === 'factures' ? (
            <>
              <option value="payee">Pay&eacute;es</option>
              <option value="en-attente">En attente</option>
              <option value="en-retard">En retard</option>
              <option value="annulee">Annul&eacute;es</option>
            </>
          ) : (
            <>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoy&eacute;</option>
              <option value="accepte">Accept&eacute;</option>
              <option value="refuse">Refus&eacute;</option>
              <option value="expire">Expir&eacute;</option>
            </>
          )}
        </select>
      </div>

      {/* Devis Error Banner */}
      {devisError && activeTab === 'devis' && (
        <div className="bg-white/[0.02] border border-[rgba(251,191,36,0.2)] rounded-xl p-4">
          <p className="text-sm text-white/90 font-medium mb-1">Table &quot;devis&quot; non trouv&eacute;e</p>
          <p className="text-xs text-white/30 mb-3">
            La table devis n&apos;existe pas encore dans Supabase. Ex&eacute;cutez le SQL ci-dessous dans le SQL Editor de votre dashboard Supabase.
          </p>
          <details className="cursor-pointer">
            <summary className="text-xs text-[#a78bfa] font-medium">Voir le SQL</summary>
            <pre className="mt-2 p-3 bg-[#050505] rounded-lg text-xs text-white/90 overflow-x-auto whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS devis (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  numero TEXT,
  lignes JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'brouillon',
  date_creation TEXT,
  date_validite TEXT,
  notes TEXT,
  montant_ht NUMERIC DEFAULT 0,
  montant_ttc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_all ON devis FOR ALL USING (true);

-- Ajouter colonnes manquantes sur invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lignes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS montant_ht NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS montant_ttc NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS devis_id TEXT;`}
            </pre>
          </details>
        </div>
      )}

      {/* ===== FACTURES TABLE ===== */}
      {activeTab === 'factures' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">N&deg;</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Montant TTC</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">&Eacute;mission</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">&Eacute;ch&eacute;ance</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, i) => (
                  <tr
                    key={inv.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#a78bfa]">{inv.numero}</td>
                    <td className="px-4 py-3 font-medium text-white/90">{getClientName(inv.clientId)}</td>
                    <td className="px-4 py-3 text-white/30 hidden lg:table-cell truncate max-w-[200px]">{inv.description}</td>
                    <td className="px-4 py-3 font-bold text-right text-white/90">
                      {(inv.montantTTC || inv.montant).toLocaleString('fr-FR')} &euro;
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">
                      {inv.dateEmission ? new Date(inv.dateEmission).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">
                      {inv.dateEcheance ? new Date(inv.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusDropdown invoice={inv} onUpdate={updateInvoiceStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {inv.lignes && inv.lignes.length > 0 && (
                          <button
                            onClick={() => downloadPDF('facture', inv)}
                            className="p-1.5 rounded-lg hover:bg-[rgba(108,92,231,0.08)] text-white/30 hover:text-[#a78bfa] transition-colors"
                            title="T&eacute;l&eacute;charger PDF"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <button
                          onClick={async () => { await deleteInvoice(inv.id); refresh(); }}
                          className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.08)] text-white/30 hover:text-[#f87171] transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Receipt size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucune facture trouv&eacute;e</p>
            </div>
          )}
        </div>
      )}

      {/* ===== DEVIS TABLE ===== */}
      {activeTab === 'devis' && !devisError && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">N&deg;</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Notes</th>
                  <th className="px-4 py-3 font-medium text-right">Montant TTC</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Cr&eacute;&eacute; le</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Validit&eacute;</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevis.map((d, i) => (
                  <tr
                    key={d.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#a78bfa]">{d.numero}</td>
                    <td className="px-4 py-3 font-medium text-white/90">{getClientName(d.clientId)}</td>
                    <td className="px-4 py-3 text-white/30 hidden lg:table-cell truncate max-w-[200px]">{d.notes || '-'}</td>
                    <td className="px-4 py-3 font-bold text-right text-white/90">{d.montantTTC.toLocaleString('fr-FR')} &euro;</td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">
                      {d.dateCreation ? new Date(d.dateCreation).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">
                      {d.dateValidite ? new Date(d.dateValidite).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <DevisStatusDropdown devis={d} onUpdate={updateDevisStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => downloadPDF('devis', d)}
                          className="p-1.5 rounded-lg hover:bg-[rgba(108,92,231,0.08)] text-white/30 hover:text-[#a78bfa] transition-colors"
                          title="T&eacute;l&eacute;charger PDF"
                        >
                          <Download size={14} />
                        </button>
                        {(d.status === 'envoye' || d.status === 'accepte') && (
                          <button
                            onClick={() => convertDevisToInvoice(d)}
                            className="p-1.5 rounded-lg hover:bg-[rgba(52,211,153,0.08)] text-white/30 hover:text-[#34d399] transition-colors"
                            title="Convertir en facture"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                        )}
                        <button
                          onClick={async () => { await deleteDevis(d.id); refresh(); }}
                          className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.08)] text-white/30 hover:text-[#f87171] transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDevis.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucun devis trouv&eacute;</p>
            </div>
          )}
        </div>
      )}

      {/* ===== NEW DOCUMENT MODAL ===== */}
      <DocumentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        clients={clients}
        existingNumeros={modalType === 'devis' ? devisList.map(d => d.numero) : invoices.map(i => i.numero)}
        onSave={async (doc) => {
          if (modalType === 'devis') {
            await saveDevis(doc as Devis);
          } else {
            await saveInvoice(doc as Invoice);
          }
          await refresh();
          setModalOpen(false);
        }}
      />
    </div>
  );
}

// ========== INVOICE STATUS DROPDOWN ==========
function InvoiceStatusDropdown({ invoice, onUpdate }: {
  invoice: Invoice;
  onUpdate: (inv: Invoice, status: InvoiceStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const statuses: InvoiceStatus[] = ['en-attente', 'payee', 'en-retard', 'annulee'];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1">
        <StatusBadge status={invoice.status} type="facture" />
        <ChevronDown size={12} className="text-white/30" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 bg-[#0a0a0a] border border-white/[0.06] rounded-xl shadow-lg py-1 min-w-[140px]">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => { onUpdate(invoice, s); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/[0.03] transition-colors ${
                  invoice.status === s ? 'text-[#a78bfa] font-medium' : 'text-white/90'
                }`}
              >
                {INVOICE_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ========== DEVIS STATUS DROPDOWN ==========
function DevisStatusDropdown({ devis, onUpdate }: {
  devis: Devis;
  onUpdate: (d: Devis, status: DevisStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const statuses: DevisStatus[] = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1">
        <StatusBadge status={devis.status} type="devis" />
        <ChevronDown size={12} className="text-white/30" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 bg-[#0a0a0a] border border-white/[0.06] rounded-xl shadow-lg py-1 min-w-[140px]">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => { onUpdate(devis, s); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/[0.03] transition-colors ${
                  devis.status === s ? 'text-[#a78bfa] font-medium' : 'text-white/90'
                }`}
              >
                {DEVIS_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ========== CATALOGUE PRESTATIONS PREDEFINIES ==========
interface PresetPrestation {
  id: string;
  nom: string;
  description: string;
  prixHT: number;
  type: 'ponctuel' | 'mensuel';
  details: string[];
  emoji: string;
}

const PRESET_PRESTATIONS: PresetPrestation[] = [
  {
    id: 'site-web-chatbot',
    nom: 'Site Web Vitrine + Chatbot IA',
    description: 'Cr\u00e9ation d\'un site web vitrine professionnel avec chatbot IA int\u00e9gr\u00e9',
    prixHT: 400,
    type: 'ponctuel',
    details: [
      'Design responsive adapt\u00e9 \u00e0 votre image',
      'Chatbot intelligent int\u00e9gr\u00e9 pour prise de commande en ligne',
      'Suivi de commande en temps r\u00e9el',
      'Suggestions personnalis\u00e9es selon la carte',
      'R\u00e9ponses aux questions fr\u00e9quentes (horaires, adresse, allerg\u00e8nes)',
      'Mises \u00e0 jour et am\u00e9liorations continues',
    ],
    emoji: '\u{1F310}',
  },
  {
    id: 'maintenance-site',
    nom: 'Maintenance Site Web',
    description: 'Maintenance et h\u00e9bergement du site web vitrine',
    prixHT: 20,
    type: 'mensuel',
    details: [
      'H\u00e9bergement et nom de domaine inclus',
      'Mises \u00e0 jour de s\u00e9curit\u00e9',
      'Support technique',
      'Sauvegardes r\u00e9guli\u00e8res',
    ],
    emoji: '\u{1F527}',
  },
  {
    id: 'chatbot-ia',
    nom: 'Chatbot IA',
    description: 'Chatbot intelligent int\u00e9grable sur site web ou en standalone',
    prixHT: 90,
    type: 'mensuel',
    details: [
      'Prise de commande automatis\u00e9e par conversation',
      'Suivi de commande en temps r\u00e9el',
      'Suggestions personnalis\u00e9es selon la carte',
      'R\u00e9ponses aux questions fr\u00e9quentes (horaires, adresse, allerg\u00e8nes)',
      'Mises \u00e0 jour et am\u00e9liorations continues',
    ],
    emoji: '\u{1F916}',
  },
  {
    id: 'receptionniste-ia',
    nom: 'R\u00e9ceptionniste IA Vocale',
    description: 'Standard t\u00e9l\u00e9phonique intelligent propuls\u00e9 par IA',
    prixHT: 140,
    type: 'mensuel',
    details: [
      'Accueil t\u00e9l\u00e9phonique automatis\u00e9 24h/24',
      'Prise de commande vocale compl\u00e8te',
      'V\u00e9rification des stocks en temps r\u00e9el',
      'Envoi automatique de SMS de confirmation au client',
      'Gestion des horaires et informations restaurant',
    ],
    emoji: '\u{1F4DE}',
  },
  {
    id: 'programme-fidelite',
    nom: 'Programme de Fid\u00e9lit\u00e9',
    description: 'Syst\u00e8me de fid\u00e9lisation client int\u00e9gr\u00e9 au CRM',
    prixHT: 80,
    type: 'mensuel',
    details: [
      'Attribution automatique de points \u00e0 chaque commande',
      'Catalogue de r\u00e9compenses personnalisable',
      'Suivi des points et historique client',
      'Tableau de bord statistiques fid\u00e9lit\u00e9',
      'Notifications automatiques (seuils de r\u00e9compense atteints)',
    ],
    emoji: '\u2B50',
  },
  {
    id: 'automatisation-custom',
    nom: 'Automatisation sur mesure',
    description: 'Solution d\'automatisation personnalis\u00e9e selon vos besoins',
    prixHT: 200,
    type: 'ponctuel',
    details: [
      'Analyse de vos processus existants',
      'D\u00e9veloppement de workflows automatis\u00e9s',
      'Int\u00e9gration avec vos outils existants',
      'Formation et documentation',
    ],
    emoji: '\u26A1',
  },
];

// ========== DOCUMENT MODAL (Devis + Facture) ==========
function DocumentModal({ isOpen, onClose, type, clients, existingNumeros, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  type: 'facture' | 'devis';
  clients: Client[];
  existingNumeros: string[];
  onSave: (doc: Devis | Invoice) => void;
}) {
  const [clientId, setClientId] = useState('');
  const [lignes, setLignes] = useState<DocumentLigne[]>([emptyLigne()]);
  const [notes, setNotes] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [status, setStatus] = useState<string>(type === 'devis' ? 'brouillon' : 'en-attente');
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [showCatalog, setShowCatalog] = useState(true);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setClientId('');
      setLignes([]);
      setNotes('');
      setStatus(type === 'devis' ? 'brouillon' : 'en-attente');
      setSelectedPresets(new Set());
      setShowCatalog(true);
      setExpandedPreset(null);
      // Default date: +30 days
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setDateEnd(d.toISOString().split('T')[0]);
    }
  }, [isOpen, type]);

  // Toggle a preset prestation
  const togglePreset = (preset: PresetPrestation) => {
    const newSelected = new Set(selectedPresets);
    if (newSelected.has(preset.id)) {
      // Remove preset
      newSelected.delete(preset.id);
      setLignes(prev => prev.filter(l => l.description !== `${preset.nom}\n${preset.description}`));
    } else {
      // Add preset
      newSelected.add(preset.id);
      const newLigne: DocumentLigne = {
        description: `${preset.nom}\n${preset.description}`,
        quantite: 1,
        prixUnitaire: preset.prixHT,
        tva: 0, // TVA non applicable, art. 293 B du CGI
      };
      setLignes(prev => [...prev, newLigne]);
    }
    setSelectedPresets(newSelected);
  };

  const updateLigne = (index: number, field: keyof DocumentLigne, value: string | number) => {
    const updated = [...lignes];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setLignes(updated);
  };

  const addLigne = () => setLignes([...lignes, emptyLigne()]);
  const removeLigne = (index: number) => {
    // Also un-check preset if removing a preset line
    const ligne = lignes[index];
    const matchingPreset = PRESET_PRESTATIONS.find(p => `${p.nom}\n${p.description}` === ligne.description);
    if (matchingPreset) {
      const newSelected = new Set(selectedPresets);
      newSelected.delete(matchingPreset.id);
      setSelectedPresets(newSelected);
    }
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const totalHT = calcTotalHT(lignes);
  const totalTVA = calcTotalTVA(lignes);
  const totalTTC = totalHT + totalTVA;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lignes.length === 0) return;
    const now = new Date();
    const prefix = type === 'devis' ? 'DEV' : 'FAC';
    const numero = nextNumero(prefix, existingNumeros);

    if (type === 'devis') {
      const devis: Devis = {
        id: generateId(),
        clientId,
        numero,
        lignes,
        status: status as DevisStatus,
        dateCreation: now.toISOString().split('T')[0],
        dateValidite: dateEnd,
        notes,
        montantHT: totalHT,
        montantTTC: totalTTC,
      };
      onSave(devis);
    } else {
      const invoice: Invoice = {
        id: generateId(),
        clientId,
        numero,
        montant: totalTTC,
        status: status as InvoiceStatus,
        dateEmission: now.toISOString().split('T')[0],
        dateEcheance: dateEnd,
        description: notes || lignes.map(l => l.description.split('\n')[0]).filter(Boolean).join(', '),
        mois: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        lignes,
        montantHT: totalHT,
        montantTTC: totalTTC,
      };
      onSave(invoice);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'devis' ? 'Nouveau devis' : 'Nouvelle facture'}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Client */}
        <div>
          <label className="block text-xs text-white/40 mb-1">Client</label>
          <select
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
          >
            <option value="">S\u00e9lectionner un client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.entreprise} - {c.prenom} {c.nom}</option>
            ))}
          </select>
        </div>

        {/* Catalogue de prestations predefinies */}
        <div>
          <button
            type="button"
            onClick={() => setShowCatalog(!showCatalog)}
            className="flex items-center gap-2 text-xs font-medium text-[#a78bfa] hover:text-[#7c6df0] transition-colors mb-2"
          >
            <Package size={14} />
            Catalogue de prestations
            <ChevronDown size={12} className={`transition-transform ${showCatalog ? 'rotate-180' : ''}`} />
          </button>

          {showCatalog && (
            <div className="grid grid-cols-1 gap-2">
              {PRESET_PRESTATIONS.map((preset) => {
                const isSelected = selectedPresets.has(preset.id);
                const isExpanded = expandedPreset === preset.id;
                return (
                  <div key={preset.id} className="rounded-lg border border-white/[0.04] overflow-hidden transition-all">
                    <div
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[rgba(108,92,231,0.06)] border-[rgba(108,92,231,0.15)]'
                          : 'bg-[#050505] hover:bg-white/[0.03]'
                      }`}
                      onClick={() => togglePreset(preset)}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#6c5ce7] border-[#6c5ce7]'
                          : 'border-white/[0.12] hover:border-[rgba(108,92,231,0.4)]'
                      }`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>

                      {/* Emoji */}
                      <span className="text-lg flex-shrink-0">{preset.emoji}</span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white/90 truncate">{preset.nom}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            preset.type === 'mensuel'
                              ? 'bg-[rgba(96,165,250,0.08)] text-[#60a5fa]'
                              : 'bg-[rgba(52,211,153,0.08)] text-[#34d399]'
                          }`}>
                            {preset.type === 'mensuel' ? '/mois' : 'unique'}
                          </span>
                        </div>
                        <p className="text-xs text-white/30 truncate">{preset.description}</p>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white/90">{preset.prixHT} \u20ac</p>
                        <p className="text-[10px] text-white/30">HT</p>
                      </div>

                      {/* Expand details */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpandedPreset(isExpanded ? null : preset.id); }}
                        className="p-1 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/90 transition-colors flex-shrink-0"
                      >
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 bg-white/[0.02] border-t border-white/[0.04]">
                        <ul className="space-y-1">
                          {preset.details.map((detail, i) => (
                            <li key={i} className="text-xs text-white/30 flex items-start gap-1.5">
                              <span className="text-[#a78bfa] mt-0.5">&bull;</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedPresets.size > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#34d399]">
              <Check size={12} />
              {selectedPresets.size} prestation{selectedPresets.size > 1 ? 's' : ''} s\u00e9lectionn\u00e9e{selectedPresets.size > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Separateur */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-white/25 uppercase tracking-wider">Lignes du document</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Lignes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/40 font-medium">
              Prestations ({lignes.length} ligne{lignes.length > 1 ? 's' : ''})
            </label>
            <button
              type="button"
              onClick={addLigne}
              className="text-xs text-[#a78bfa] hover:text-[#7c6df0] font-medium flex items-center gap-1"
            >
              <Plus size={12} /> Ajouter une ligne libre
            </button>
          </div>

          {lignes.length === 0 && (
            <div className="text-center py-6 bg-[#050505] rounded-lg border border-dashed border-white/[0.08]">
              <Package size={24} className="mx-auto mb-2 text-white/20" />
              <p className="text-xs text-white/30">S\u00e9lectionnez des prestations dans le catalogue</p>
              <p className="text-xs text-white/30">ou ajoutez une ligne libre</p>
            </div>
          )}

          <div className="space-y-2">
            {lignes.map((ligne, i) => {
              const isPresetLine = PRESET_PRESTATIONS.some(p => `${p.nom}\n${p.description}` === ligne.description);
              return (
                <div key={i} className={`flex gap-2 items-start p-3 rounded-lg border ${
                  isPresetLine ? 'bg-[rgba(108,92,231,0.03)] border-[rgba(108,92,231,0.1)]' : 'bg-[#050505] border-white/[0.04]'
                }`}>
                  <div className="flex-1 space-y-2">
                    {isPresetLine ? (
                      <div className="flex items-center gap-2">
                        <Package size={12} className="text-[#a78bfa] flex-shrink-0" />
                        <span className="text-sm font-medium text-white/90">{ligne.description.split('\n')[0]}</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Description de la prestation"
                        value={ligne.description}
                        onChange={(e) => updateLigne(i, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
                      />
                    )}
                    <div className="flex gap-2">
                      <div className="w-20">
                        <label className="text-[10px] text-white/30">Qt\u00e9</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={ligne.quantite}
                          onChange={(e) => updateLigne(i, 'quantite', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-white/30">Prix unitaire HT</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          required
                          value={ligne.prixUnitaire || ''}
                          onChange={(e) => updateLigne(i, 'prixUnitaire', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-white/30">TVA %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ligne.tva}
                          onChange={(e) => updateLigne(i, 'tva', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="w-24 text-right pt-3">
                        <p className="text-sm font-bold text-white/90">
                          {calcLigneTotal(ligne).toLocaleString('fr-FR')} \u20ac
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLigne(i)}
                    className="mt-1 p-1 rounded-lg hover:bg-[rgba(248,113,113,0.08)] text-white/30 hover:text-[#f87171] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        {lignes.length > 0 && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/30">Sous-total HT</span>
              <span className="font-medium text-white/90">{totalHT.toLocaleString('fr-FR')} \u20ac</span>
            </div>
            {totalTVA > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-white/30">TVA</span>
                <span className="font-medium text-white/90">{totalTVA.toLocaleString('fr-FR')} \u20ac</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-white/30">TVA</span>
                <span className="text-xs text-white/25 italic">Non applicable, art. 293 B du CGI</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-white/[0.06] pt-2">
              <span className="text-white/90">Total TTC</span>
              <span className="text-[#a78bfa]">{totalTTC.toLocaleString('fr-FR')} \u20ac</span>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1">
              {type === 'devis' ? 'Date de validit\u00e9' : 'Date d\'\u00e9ch\u00e9ance'}
            </label>
            <input
              type="date"
              required
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm focus:outline-none"
            >
              {type === 'devis' ? (
                <>
                  <option value="brouillon">Brouillon</option>
                  <option value="envoye">Envoy\u00e9</option>
                </>
              ) : (
                <>
                  <option value="en-attente">En attente</option>
                  <option value="payee">Pay\u00e9e</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-white/40 mb-1">
            {type === 'devis' ? 'Notes / Conditions' : 'Description'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={type === 'devis' ? 'Conditions particuli\u00e8res, notes...' : 'Description de la facture...'}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/90 text-sm resize-none focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.06] text-white/40 text-sm hover:text-white/90 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={lignes.length === 0}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6df0] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {type === 'devis' ? 'Cr\u00e9er le devis' : 'Cr\u00e9er la facture'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

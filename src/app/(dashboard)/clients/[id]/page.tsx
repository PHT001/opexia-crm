'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Tag,
  Calendar, Clock, TrendingUp, FileText, MessageSquare,
  Plus, Edit3, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import {
  getClient, getProjectsByClient, getInvoicesByClient, getInteractionsByClient,
  saveInteraction, generateId,
} from '@/lib/store';
import {
  Client, Project, Invoice, Interaction, SERVICE_LABELS,
  PROJECT_STATUS_LABELS, INVOICE_STATUS_LABELS, PIPELINE_LABELS,
} from '@/lib/types';
import Modal from '@/components/Modal';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [activeTab, setActiveTab] = useState<'apercu' | 'projets' | 'factures' | 'interactions'>('apercu');
  const [addInteractionOpen, setAddInteractionOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const id = params.id as string;
      const c = await getClient(id);
      if (!c) {
        router.push('/clients');
        return;
      }
      setClient(c);
      const [proj, inv, inter] = await Promise.all([
        getProjectsByClient(id),
        getInvoicesByClient(id),
        getInteractionsByClient(id),
      ]);
      setProjects(proj);
      setInvoices(inv);
      setInteractions(inter);
      setMounted(true);
    };
    loadData();
  }, [params.id, router]);

  const refresh = async () => {
    const id = params.id as string;
    setInteractions(await getInteractionsByClient(id));
  };

  if (!mounted || !client) {
    return (
      <div className="p-6 pt-16 lg:pt-6">
        <div className="h-8 w-48 bg-card rounded animate-pulse" />
      </div>
    );
  }

  const totalFacture = invoices.reduce((sum, i) => sum + i.montant, 0);
  const totalPaye = invoices.filter(i => i.status === 'payee').reduce((sum, i) => sum + i.montant, 0);

  const tabs = [
    { id: 'apercu', label: 'Aperçu' },
    { id: 'projets', label: `Projets (${projects.length})` },
    { id: 'factures', label: `Factures (${invoices.length})` },
    { id: 'interactions', label: `Historique (${interactions.length})` },
  ] as const;

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux clients
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary text-xl font-bold">
              {client.prenom[0]}{client.nom[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{client.prenom} {client.nom}</h1>
              <p className="text-muted flex items-center gap-2">
                <Building2 size={14} />
                {client.entreprise}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium status-${client.status} self-start`}>
            {client.status === 'client' ? 'Client' : client.status === 'prospect' ? 'Prospect' : 'Perdu'}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted mb-1">Mensuel</p>
          <p className="text-lg font-bold text-foreground">{client.montantMensuel} €</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted mb-1">Total facturé</p>
          <p className="text-lg font-bold text-foreground">{totalFacture.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted mb-1">Projets</p>
          <p className="text-lg font-bold text-foreground">{projects.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted mb-1">Pipeline</p>
          <p className="text-lg font-bold text-primary">{PIPELINE_LABELS[client.pipelineStage]}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'apercu' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          {/* Info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Informations</h3>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={15} className="text-muted" />
                  <span className="text-foreground">{client.email}</span>
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={15} className="text-muted" />
                  <span className="text-foreground">{client.telephone}</span>
                </div>
              )}
              {client.siteWeb && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe size={15} className="text-muted" />
                  <span className="text-foreground">{client.siteWeb}</span>
                </div>
              )}
              {client.adresse && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={15} className="text-muted" />
                  <span className="text-foreground">{client.adresse}</span>
                </div>
              )}
              {client.secteur && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag size={15} className="text-muted" />
                  <span className="text-foreground">{client.secteur}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={15} className="text-muted" />
                <span className="text-muted">Client depuis le {new Date(client.dateCreation).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={15} className="text-muted" />
                <span className="text-muted">Dernier contact : {new Date(client.dernierContact).toLocaleDateString('fr-FR')}</span>
              </div>
              {client.source && (
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp size={15} className="text-muted" />
                  <span className="text-muted">Source : {client.source}</span>
                </div>
              )}
            </div>
          </div>

          {/* Services + Notes */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Services actifs</h3>
              {client.servicesSouscrits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {client.servicesSouscrits.map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                      {SERVICE_LABELS[s]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Aucun service souscrit</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Notes</h3>
              <p className="text-sm text-muted whitespace-pre-wrap">{client.notes || 'Aucune note'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projets' && (
        <div className="space-y-3 animate-fade-in">
          {projects.map((project) => (
            <div key={project.id} className="bg-card border border-border rounded-2xl p-4 hover:border-border-light transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">{project.nom}</h4>
                  <p className="text-xs text-muted mt-0.5">{SERVICE_LABELS[project.type]}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  project.status === 'en-cours' ? 'bg-info/15 text-info border border-info/30' :
                  project.status === 'termine' ? 'bg-success/15 text-success border border-success/30' :
                  project.status === 'en-attente' ? 'bg-warning/15 text-warning border border-warning/30' :
                  'bg-danger/15 text-danger border border-danger/30'
                }`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </div>
              <p className="text-sm text-muted mb-3">{project.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted mb-2">
                <span>Début : {new Date(project.dateDebut).toLocaleDateString('fr-FR')}</span>
                <span>Deadline : {new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
                <span className="font-medium text-foreground">{project.montant.toLocaleString('fr-FR')} €</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${project.progression}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">{project.progression}%</p>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-12 text-muted">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucun projet pour ce client</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'factures' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border bg-sidebar">
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Description</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Échéance</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{inv.numero}</td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{inv.description}</td>
                  <td className="px-4 py-3 font-medium">{inv.montant} €</td>
                  <td className="px-4 py-3 text-muted text-xs hidden sm:table-cell">
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
          {invoices.length === 0 && (
            <div className="text-center py-12 text-muted">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucune facture</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'interactions' && (
        <div className="space-y-3 animate-fade-in">
          <button
            onClick={() => setAddInteractionOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Ajouter une interaction
          </button>

          <div className="space-y-3">
            {[...interactions].sort((a, b) => b.date.localeCompare(a.date)).map((inter) => (
              <div key={inter.id} className="bg-card border border-border rounded-2xl p-4 hover:border-border-light transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    inter.type === 'appel' ? 'bg-success/15 text-success' :
                    inter.type === 'email' ? 'bg-info/15 text-info' :
                    inter.type === 'rdv' ? 'bg-primary/15 text-primary' :
                    'bg-warning/15 text-warning'
                  }`}>
                    {inter.type === 'appel' ? 'Appel' : inter.type === 'email' ? 'Email' : inter.type === 'rdv' ? 'RDV' : 'Note'}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h4 className="font-medium text-foreground text-sm">{inter.sujet}</h4>
                <p className="text-sm text-muted mt-1">{inter.contenu}</p>
              </div>
            ))}
          </div>

          {interactions.length === 0 && (
            <div className="text-center py-12 text-muted">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucune interaction enregistrée</p>
            </div>
          )}

          <AddInteractionModal
            isOpen={addInteractionOpen}
            onClose={() => setAddInteractionOpen(false)}
            clientId={client.id}
            onSave={() => { refresh(); setAddInteractionOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

function AddInteractionModal({ isOpen, onClose, clientId, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    type: 'appel' as Interaction['type'],
    sujet: '',
    contenu: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveInteraction({
      id: generateId(),
      clientId,
      ...form,
    });
    onSave();
    setForm({ type: 'appel', sujet: '', contenu: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle interaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Interaction['type'] })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="appel">Appel</option>
              <option value="email">Email</option>
              <option value="rdv">RDV</option>
              <option value="note">Note</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Sujet</label>
          <input
            type="text"
            required
            value={form.sujet}
            onChange={(e) => setForm({ ...form, sujet: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Contenu</label>
          <textarea
            value={form.contenu}
            onChange={(e) => setForm({ ...form, contenu: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted text-sm transition-colors hover:text-foreground"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

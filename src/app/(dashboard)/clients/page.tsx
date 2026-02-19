'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Users, UserCheck, UserX, Eye, Trash2, Edit3 } from 'lucide-react';
import { getClients, saveClient, deleteClient, generateId } from '@/lib/store';
import { Client, ClientStatus, SERVICE_LABELS, ServiceType, ServicePricing, PipelineStage, PIPELINE_LABELS } from '@/lib/types';
import Link from 'next/link';
import Modal from '@/components/Modal';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClientStatus | 'tous'>('tous');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setClients(await getClients());
      setMounted(true);
    };
    loadData();
  }, []);

  const refresh = async () => setClients(await getClients());

  const filtered = clients.filter(c => {
    const matchSearch = search === '' ||
      `${c.prenom} ${c.nom} ${c.entreprise} ${c.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'tous' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce client ?')) {
      await deleteClient(id);
      await refresh();
    }
  };

  const handleSave = async (client: Client) => {
    await saveClient(client);
    await refresh();
    setModalOpen(false);
    setEditingClient(null);
  };

  const openNew = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  if (!mounted) return <div className="p-6 pt-16 lg:pt-6"><div className="h-8 w-48 bg-card rounded animate-pulse" /></div>;

  const countByStatus = (s: ClientStatus) => clients.filter(c => c.status === s).length;

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients & Prospects</h1>
          <p className="text-sm text-muted mt-1">{clients.length} contacts au total</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors btn-glow"
        >
          <Plus size={16} />
          Nouveau contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus(filterStatus === 'client' ? 'tous' : 'client')}
          className={`p-3 rounded-xl transition-all ${filterStatus === 'client' ? 'kpi-glow border-success/30' : 'kpi-glow'}`}
        >
          <UserCheck size={18} className="text-success mb-1" />
          <p className="text-xl font-bold text-foreground">{countByStatus('client')}</p>
          <p className="text-xs text-muted">Clients</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === 'prospect' ? 'tous' : 'prospect')}
          className={`p-3 rounded-xl transition-all ${filterStatus === 'prospect' ? 'kpi-glow border-info/30' : 'kpi-glow'}`}
        >
          <Users size={18} className="text-info mb-1" />
          <p className="text-xl font-bold text-foreground">{countByStatus('prospect')}</p>
          <p className="text-xs text-muted">Prospects</p>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === 'perdu' ? 'tous' : 'perdu')}
          className={`p-3 rounded-xl transition-all ${filterStatus === 'perdu' ? 'kpi-glow border-danger/30' : 'kpi-glow'}`}
        >
          <UserX size={18} className="text-danger mb-1" />
          <p className="text-xl font-bold text-foreground">{countByStatus('perdu')}</p>
          <p className="text-xs text-muted">Perdus</p>
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
        {filterStatus !== 'tous' && (
          <button
            onClick={() => setFilterStatus('tous')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-muted hover:text-foreground transition-colors"
          >
            <Filter size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card-glow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border bg-sidebar">
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Entreprise</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Services</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Setup</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Récurrent</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Pipeline</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <tr
                  key={client.id}
                  className="border-b border-border/50 hover:bg-card-hover transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="hover:text-primary">
                      <p className="font-medium text-foreground">{client.prenom} {client.nom}</p>
                      <p className="text-xs text-muted md:hidden">{client.entreprise}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{client.entreprise}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {client.servicesSouscrits.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          {SERVICE_LABELS[s]}
                        </span>
                      ))}
                      {client.servicesSouscrits.length === 0 && <span className="text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium hidden sm:table-cell">
                    {(client.servicePricing?.reduce((sum, sp) => sum + sp.miseEnPlace, 0) || 0) > 0
                      ? `${client.servicePricing!.reduce((sum, sp) => sum + sp.miseEnPlace, 0)} €`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium hidden sm:table-cell">
                    {client.montantMensuel > 0 ? `${client.montantMensuel} €/mois` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium status-${client.status}`}>
                      {client.status === 'client' ? 'Client' : client.status === 'prospect' ? 'Prospect' : 'Perdu'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs hidden lg:table-cell">
                    {PIPELINE_LABELS[client.pipelineStage]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/clients/${client.id}`}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        onClick={() => openEdit(client)}
                        className="p-1.5 rounded-lg hover:bg-info/10 text-muted hover:text-info transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-colors"
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
          <div className="text-center py-12 text-muted">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucun contact trouvé</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <ClientFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingClient(null); }}
        onSave={handleSave}
        client={editingClient}
      />
    </div>
  );
}

function ClientFormModal({ isOpen, onClose, onSave, client }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  client: Client | null;
}) {
  const [form, setForm] = useState<Partial<Client>>({});

  useEffect(() => {
    if (client) {
      setForm(client);
    } else {
      setForm({
        id: generateId(),
        nom: '', prenom: '', entreprise: '', email: '', telephone: '',
        status: 'prospect', pipelineStage: 'contact',
        servicesSouscrits: [], servicePricing: [], montantMensuel: 0,
        dateCreation: new Date().toISOString().split('T')[0],
        dernierContact: new Date().toISOString().split('T')[0],
        notes: '', secteur: '', source: '',
      });
    }
  }, [client, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-calculate montantMensuel from service pricing
    const totalRecurrent = (form.servicePricing || []).reduce((sum, sp) => sum + sp.recurrent, 0);
    onSave({ ...form, montantMensuel: totalRecurrent } as Client);
  };

  const toggleService = (service: ServiceType) => {
    const current = form.servicesSouscrits || [];
    const currentPricing = form.servicePricing || [];
    if (current.includes(service)) {
      setForm({
        ...form,
        servicesSouscrits: current.filter(s => s !== service),
        servicePricing: currentPricing.filter(sp => sp.service !== service),
      });
    } else {
      setForm({
        ...form,
        servicesSouscrits: [...current, service],
        servicePricing: [...currentPricing, { service, miseEnPlace: 0, recurrent: 0 }],
      });
    }
  };

  const updateServicePrice = (service: ServiceType, field: 'miseEnPlace' | 'recurrent', value: number) => {
    const currentPricing = form.servicePricing || [];
    const updated = currentPricing.map(sp =>
      sp.service === service ? { ...sp, [field]: value } : sp
    );
    setForm({ ...form, servicePricing: updated });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Modifier le contact' : 'Nouveau contact'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Prénom</label>
            <input
              type="text"
              required
              value={form.prenom || ''}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Nom</label>
            <input
              type="text"
              required
              value={form.nom || ''}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">Entreprise</label>
          <input
            type="text"
            required
            value={form.entreprise || ''}
            onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Téléphone</label>
            <input
              type="text"
              value={form.telephone || ''}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Secteur</label>
            <select
              value={form.secteur || ''}
              onChange={(e) => setForm({ ...form, secteur: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Sélectionner un secteur</option>
              <option value="Restauration">Restauration</option>
              <option value="Immobilier">Immobilier</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Santé">Santé</option>
              <option value="Beauté & Bien-être">Beauté & Bien-être</option>
              <option value="BTP & Construction">BTP & Construction</option>
              <option value="Automobile">Automobile</option>
              <option value="Finance & Assurance">Finance & Assurance</option>
              <option value="Juridique">Juridique</option>
              <option value="Éducation & Formation">Éducation & Formation</option>
              <option value="Marketing & Communication">Marketing & Communication</option>
              <option value="IT & Tech">IT & Tech</option>
              <option value="Tourisme & Hôtellerie">Tourisme & Hôtellerie</option>
              <option value="Sport & Fitness">Sport & Fitness</option>
              <option value="Mode & Textile">Mode & Textile</option>
              <option value="Artisanat">Artisanat</option>
              <option value="Transport & Logistique">Transport & Logistique</option>
              <option value="Industrie">Industrie</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Source</label>
            <input
              type="text"
              value={form.source || ''}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="LinkedIn, Google Ads..."
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Statut</label>
            <select
              value={form.status || 'prospect'}
              onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="perdu">Perdu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Pipeline</label>
            <select
              value={form.pipelineStage || 'contact'}
              onChange={(e) => setForm({ ...form, pipelineStage: e.target.value as PipelineStage })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              <option value="contact">Premier Contact</option>
              <option value="demo">Démo</option>
              <option value="proposition">Proposition</option>
              <option value="negociation">Négociation</option>
              <option value="signe">Signé</option>
              <option value="perdu">Perdu</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-2">Services</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleService(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  form.servicesSouscrits?.includes(key)
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-muted hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Prix par service sélectionné */}
        {(form.servicesSouscrits?.length || 0) > 0 && (
          <div className="space-y-3">
            <label className="block text-xs text-muted">Tarification par service</label>
            {form.servicesSouscrits?.map(service => {
              const pricing = (form.servicePricing || []).find(sp => sp.service === service);
              return (
                <div key={service} className="bg-background border border-border rounded-xl p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {SERVICE_LABELS[service]}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Mise en place (€)</label>
                      <input
                        type="number"
                        min={0}
                        value={pricing?.miseEnPlace || 0}
                        onChange={(e) => updateServicePrice(service, 'miseEnPlace', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Récurrent /mois (€)</label>
                      <input
                        type="number"
                        min={0}
                        value={pricing?.recurrent || 0}
                        onChange={(e) => updateServicePrice(service, 'recurrent', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Totaux */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-xs font-medium text-muted">Total mise en place</span>
              <span className="text-sm font-bold text-foreground">
                {(form.servicePricing || []).reduce((sum, sp) => sum + sp.miseEnPlace, 0)} €
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 bg-success/5 border border-success/20 rounded-xl">
              <span className="text-xs font-medium text-muted">Total récurrent /mois</span>
              <span className="text-sm font-bold text-success">
                {(form.servicePricing || []).reduce((sum, sp) => sum + sp.recurrent, 0)} €/mois
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-muted mb-1">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
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
            {client ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

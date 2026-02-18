'use client';

import { useEffect, useState } from 'react';
import {
  FolderKanban, Plus, Search, Clock, CheckCircle, AlertCircle, Pause,
} from 'lucide-react';
import { getProjects, getClients, saveProject, generateId } from '@/lib/store';
import { Project, Client, ProjectStatus, SERVICE_LABELS, ServiceType, PROJECT_STATUS_LABELS } from '@/lib/types';
import Modal from '@/components/Modal';
import Link from 'next/link';

export default function ProjetsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'tous'>('tous');
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProjects(getProjects());
    setClients(getClients());
    setMounted(true);
  }, []);

  const refresh = () => setProjects(getProjects());

  const getClientName = (clientId: string) => {
    const c = clients.find(cl => cl.id === clientId);
    return c ? c.entreprise : 'Inconnu';
  };

  const filtered = projects.filter(p => {
    const matchSearch = search === '' ||
      `${p.nom} ${getClientName(p.clientId)} ${SERVICE_LABELS[p.type]}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'tous' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'en-cours': return <Clock size={16} className="text-info" />;
      case 'termine': return <CheckCircle size={16} className="text-success" />;
      case 'en-attente': return <Pause size={16} className="text-warning" />;
      case 'annule': return <AlertCircle size={16} className="text-danger" />;
    }
  };

  if (!mounted) return <div className="p-6 pt-16 lg:pt-6"><div className="h-8 w-48 bg-card rounded animate-pulse" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projets</h1>
          <p className="text-sm text-muted mt-1">{projects.length} projets au total</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nouveau projet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['en-cours', 'en-attente', 'termine', 'annule'] as ProjectStatus[]).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'tous' : status)}
            className={`p-3 rounded-xl border transition-colors text-left ${
              filterStatus === status ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:border-border-light'
            }`}
          >
            {statusIcon(status)}
            <p className="text-xl font-bold text-foreground mt-1">{projects.filter(p => p.status === status).length}</p>
            <p className="text-xs text-muted">{PROJECT_STATUS_LABELS[status]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Rechercher un projet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((project, i) => (
          <div
            key={project.id}
            className="bg-card border border-border rounded-2xl p-5 hover:border-border-light transition-colors animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{project.nom}</h3>
                <Link
                  href={`/clients/${project.clientId}`}
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  {getClientName(project.clientId)}
                </Link>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                project.status === 'en-cours' ? 'bg-info/15 text-info border border-info/30' :
                project.status === 'termine' ? 'bg-success/15 text-success border border-success/30' :
                project.status === 'en-attente' ? 'bg-warning/15 text-warning border border-warning/30' :
                'bg-danger/15 text-danger border border-danger/30'
              }`}>
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
            </div>

            <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-xs mb-3">
              {SERVICE_LABELS[project.type]}
            </span>

            <p className="text-sm text-muted mb-4 line-clamp-2">{project.description}</p>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted">Progression</span>
                <span className="font-medium text-foreground">{project.progression}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    project.progression === 100 ? 'bg-success' : 'bg-primary'
                  }`}
                  style={{ width: `${project.progression}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <span>Début : {new Date(project.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              <span>Deadline : {new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              <span className="font-medium text-foreground">{project.montant.toLocaleString('fr-FR')} €</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted">
          <FolderKanban size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucun projet trouvé</p>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        onSave={() => { refresh(); setModalOpen(false); }}
      />
    </div>
  );
}

function NewProjectModal({ isOpen, onClose, clients, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    clientId: '',
    nom: '',
    type: 'site-web' as ServiceType,
    description: '',
    deadline: '',
    montant: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProject({
      id: generateId(),
      clientId: form.clientId,
      nom: form.nom,
      type: form.type,
      status: 'en-attente',
      dateDebut: new Date().toISOString().split('T')[0],
      deadline: form.deadline,
      progression: 0,
      description: form.description,
      montant: form.montant,
    });
    onSave();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau projet">
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
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.entreprise} — {c.prenom} {c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Nom du projet</label>
          <input
            type="text"
            required
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">Type de service</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ServiceType })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            >
              {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Montant (€)</label>
            <input
              type="number"
              min={0}
              value={form.montant || ''}
              onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Deadline</label>
          <input
            type="date"
            required
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
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
            Créer le projet
          </button>
        </div>
      </form>
    </Modal>
  );
}

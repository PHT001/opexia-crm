'use client';

import { useEffect, useState } from 'react';
import { getClients, saveClient } from '@/lib/store';
import { Client, PipelineStage, PIPELINE_LABELS, SERVICE_LABELS } from '@/lib/types';
import { Building2, DollarSign, GripVertical, Users } from 'lucide-react';
import Link from 'next/link';

const stages: PipelineStage[] = ['premier-contact', 'proposition', 'signe', 'refuse', 'perdu'];

const stageColors: Record<PipelineStage, string> = {
  'premier-contact': '#818cf8',
  'proposition': '#7c5cfc',
  'signe': '#5b8af5',
  'refuse': '#a78bfa',
  'perdu': '#50506b',
};

export default function PipelinePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [mounted, setMounted] = useState(false);
  const [draggedClient, setDraggedClient] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setClients(await getClients());
      setMounted(true);
    };
    loadData();
  }, []);

  const refresh = async () => setClients(await getClients());

  const getClientsByStage = (stage: PipelineStage) =>
    clients.filter(c => c.pipelineStage === stage);

  const getMontantByStage = (stage: PipelineStage) =>
    getClientsByStage(stage).reduce((sum, c) => sum + c.montantMensuel, 0);

  const handleDragStart = (clientId: string) => {
    setDraggedClient(clientId);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (stage: PipelineStage) => {
    if (draggedClient) {
      const client = clients.find(c => c.id === draggedClient);
      if (client && client.pipelineStage !== stage) {
        const updated = {
          ...client,
          pipelineStage: stage,
          status: stage === 'signe' ? 'client' as const : (stage === 'perdu' || stage === 'refuse') ? 'perdu' as const : 'prospect' as const,
        };
        await saveClient(updated);
        await refresh();
      }
    }
    setDraggedClient(null);
    setDragOverStage(null);
  };

  if (!mounted) return <div className="p-6 pt-16 lg:pt-6"><div className="h-8 w-48 bg-card rounded animate-pulse" /></div>;

  const totalPipeline = clients.filter(c => c.pipelineStage !== 'perdu' && c.pipelineStage !== 'refuse').reduce((s, c) => s + c.montantMensuel, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 pt-16 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline Commercial</h1>
          <p className="text-sm text-muted mt-1">
            {clients.length} contacts · Valeur pipeline : <span className="text-primary font-medium">{totalPipeline.toLocaleString('fr-FR')} €/mois</span>
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageClients = getClientsByStage(stage);
          const isOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-72 card-glow rounded-xl flex flex-col transition-all ${
                isOver ? '!border-primary/30' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: stageColors[stage] }}
                    />
                    <h3 className="font-semibold text-foreground text-sm">{PIPELINE_LABELS[stage]}</h3>
                  </div>
                  <span className="text-xs bg-background px-2 py-0.5 rounded-full text-muted">
                    {stageClients.length}
                  </span>
                </div>
                {getMontantByStage(stage) > 0 && (
                  <p className="text-xs text-muted">
                    {getMontantByStage(stage).toLocaleString('fr-FR')} €/mois
                  </p>
                )}
              </div>

              {/* Cards */}
              <div className="p-2 flex-1 space-y-2 min-h-[100px]">
                {stageClients.map((client) => (
                  <div
                    key={client.id}
                    draggable
                    onDragStart={() => handleDragStart(client.id)}
                    className={`kanban-card p-3 rounded-xl border border-border-light bg-background hover:bg-card-hover transition-all ${
                      draggedClient === client.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/clients/${client.id}`} className="hover:text-primary">
                        <p className="font-medium text-foreground text-sm">{client.prenom} {client.nom}</p>
                      </Link>
                      <GripVertical size={14} className="text-muted flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                      <Building2 size={12} />
                      <span className="truncate">{client.entreprise}</span>
                    </div>
                    {client.servicesSouscrits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {client.servicesSouscrits.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                            {SERVICE_LABELS[s]}
                          </span>
                        ))}
                      </div>
                    )}
                    {client.montantMensuel > 0 && (
                      <div className="flex items-center gap-1 text-xs font-medium text-success">
                        <DollarSign size={12} />
                        {client.montantMensuel} €/mois
                      </div>
                    )}
                  </div>
                ))}
                {stageClients.length === 0 && (
                  <div className="text-center py-8 text-muted/50">
                    <Users size={24} className="mx-auto mb-2" />
                    <p className="text-xs">Aucun contact</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

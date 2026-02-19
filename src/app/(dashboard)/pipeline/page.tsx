'use client';

import { useEffect, useState } from 'react';
import { getClients, saveClient } from '@/lib/store';
import { Client, PipelineStage, PIPELINE_LABELS, SERVICE_LABELS } from '@/lib/types';
import { Building2, DollarSign, GripVertical, Users } from 'lucide-react';
import Link from 'next/link';

const stages: PipelineStage[] = ['premier-contact', 'proposition', 'signe', 'refuse', 'perdu'];

// ReelCRM palette
const stageColors: Record<PipelineStage, string> = {
  'premier-contact': '#5e9eff',
  'proposition': '#a78bfa',
  'signe': '#34d399',
  'refuse': '#fbbf24',
  'perdu': '#525252',
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

  if (!mounted) return <div className="p-5 lg:p-8 pt-16 lg:pt-8"><div className="h-8 w-48 rounded-lg animate-pulse bg-white/[0.04]" /></div>;

  const totalPipeline = clients.filter(c => c.pipelineStage !== 'perdu' && c.pipelineStage !== 'refuse').reduce((s, c) => s + c.montantMensuel, 0);

  return (
    <div className="p-5 lg:p-8 space-y-6 pt-16 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold text-[#F5F5F7]">Pipeline Commercial</h1>
          <p className="text-[13px] text-white/[0.45] mt-1">
            {clients.length} contacts · Valeur pipeline : <span className="text-[#5e9eff] font-medium">{totalPipeline.toLocaleString('fr-FR')} €/mois</span>
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
              className={`flex-shrink-0 w-72 bg-black/20 border border-white/[0.04] rounded-[14px] flex flex-col transition-all ${
                isOver ? '!border-[#5e9eff]/30' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: stageColors[stage] }}
                    />
                    <h3 className="text-[15px] font-semibold text-[#F5F5F7]">{PIPELINE_LABELS[stage]}</h3>
                  </div>
                  <span className="text-[11px] bg-white/[0.04] px-2 py-0.5 rounded-full text-white/[0.3]">
                    {stageClients.length}
                  </span>
                </div>
                {getMontantByStage(stage) > 0 && (
                  <p className="text-[11px] text-white/[0.45]">
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
                    className={`p-3 border border-white/[0.04] rounded-xl bg-black/10 hover:bg-black/30 transition-all cursor-grab active:cursor-grabbing ${
                      draggedClient === client.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/clients/${client.id}`} className="hover:text-[#6eaaff] transition-colors">
                        <p className="font-medium text-[#F5F5F7] text-xs">{client.prenom} {client.nom}</p>
                      </Link>
                      <GripVertical size={14} className="text-white/[0.3] flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/[0.3] mb-2">
                      <Building2 size={12} />
                      <span className="truncate">{client.entreprise}</span>
                    </div>
                    {client.servicesSouscrits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {client.servicesSouscrits.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-[#5e9eff]/10 text-[#a78bfa]">
                            {SERVICE_LABELS[s]}
                          </span>
                        ))}
                      </div>
                    )}
                    {client.montantMensuel > 0 && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#34d399]">
                        <DollarSign size={12} />
                        {client.montantMensuel} €/mois
                      </div>
                    )}
                  </div>
                ))}
                {stageClients.length === 0 && (
                  <div className="text-center py-8 text-white/[0.3]">
                    <Users size={24} className="mx-auto mb-2" />
                    <p className="text-[11px]">Aucun contact</p>
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

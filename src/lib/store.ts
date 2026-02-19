import { Client, Project, Invoice, Interaction, CalendarEvent, Charge } from './types';
import { supabase } from './supabase';

// ============ HELPERS ============

// Convert camelCase Client to snake_case DB row
function clientToRow(client: Client) {
  return {
    id: client.id,
    nom: client.nom,
    prenom: client.prenom,
    entreprise: client.entreprise,
    email: client.email,
    telephone: client.telephone,
    status: client.status,
    pipeline_stage: client.pipelineStage,
    services_souscrits: client.servicesSouscrits,
    service_pricing: client.servicePricing || [],
    montant_mensuel: client.montantMensuel,
    date_creation: client.dateCreation,
    dernier_contact: client.dernierContact,
    notes: client.notes,
    adresse: client.adresse,
    site_web: client.siteWeb,
    secteur: client.secteur,
    source: client.source,
    avatar: client.avatar,
  };
}

// Convert snake_case DB row to camelCase Client
function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    nom: row.nom as string,
    prenom: row.prenom as string,
    entreprise: row.entreprise as string,
    email: row.email as string || '',
    telephone: row.telephone as string || '',
    status: row.status as Client['status'],
    pipelineStage: (['premier-contact', 'proposition', 'signe', 'refuse', 'perdu'].includes(row.pipeline_stage as string) ? row.pipeline_stage : 'signe') as Client['pipelineStage'],
    servicesSouscrits: (row.services_souscrits as Client['servicesSouscrits']) || [],
    servicePricing: (row.service_pricing as Client['servicePricing']) || [],
    montantMensuel: Number(row.montant_mensuel) || 0,
    dateCreation: row.date_creation as string || '',
    dernierContact: row.dernier_contact as string || '',
    notes: row.notes as string || '',
    adresse: row.adresse as string,
    siteWeb: row.site_web as string,
    secteur: row.secteur as string,
    source: row.source as string,
    avatar: row.avatar as string,
  };
}

function invoiceToRow(invoice: Invoice) {
  return {
    id: invoice.id,
    client_id: invoice.clientId,
    numero: invoice.numero,
    montant: invoice.montant,
    status: invoice.status,
    date_emission: invoice.dateEmission,
    date_echeance: invoice.dateEcheance,
    description: invoice.description,
    mois: invoice.mois,
  };
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    numero: row.numero as string || '',
    montant: Number(row.montant) || 0,
    status: row.status as Invoice['status'],
    dateEmission: row.date_emission as string || '',
    dateEcheance: row.date_echeance as string || '',
    description: row.description as string || '',
    mois: row.mois as string || '',
  };
}

function interactionToRow(interaction: Interaction) {
  return {
    id: interaction.id,
    client_id: interaction.clientId,
    type: interaction.type,
    date: interaction.date,
    sujet: interaction.sujet,
    contenu: interaction.contenu,
  };
}

function rowToInteraction(row: Record<string, unknown>): Interaction {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    type: row.type as Interaction['type'],
    date: row.date as string || '',
    sujet: row.sujet as string || '',
    contenu: row.contenu as string || '',
  };
}

function eventToRow(event: CalendarEvent) {
  return {
    id: event.id,
    client_id: event.clientId,
    titre: event.titre,
    date: event.date,
    heure: event.heure,
    duree: event.duree,
    type: event.type,
    description: event.description,
    couleur: event.couleur,
  };
}

function rowToEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    titre: row.titre as string || '',
    date: row.date as string || '',
    heure: row.heure as string || '',
    duree: Number(row.duree) || 30,
    type: row.type as CalendarEvent['type'] || 'autre',
    description: row.description as string,
    couleur: row.couleur as string,
  };
}

function chargeToRow(charge: Charge) {
  return {
    id: charge.id,
    nom: charge.nom,
    categorie: charge.categorie,
    montant: charge.montant,
    frequence: charge.frequence,
    date_debut: charge.dateDebut,
    date_fin: charge.dateFin,
    actif: charge.actif,
    notes: charge.notes,
    fournisseur: charge.fournisseur,
  };
}

function rowToCharge(row: Record<string, unknown>): Charge {
  return {
    id: row.id as string,
    nom: row.nom as string || '',
    categorie: row.categorie as Charge['categorie'] || 'autre',
    montant: Number(row.montant) || 0,
    frequence: row.frequence as Charge['frequence'] || 'mensuel',
    dateDebut: row.date_debut as string || '',
    dateFin: row.date_fin as string,
    actif: row.actif as boolean ?? true,
    notes: row.notes as string,
    fournisseur: row.fournisseur as string,
  };
}

// ============ CLIENTS ============

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getClients error:', error); return []; }
  return (data || []).map(rowToClient);
}

export async function getClient(id: string): Promise<Client | undefined> {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return rowToClient(data);
}

export async function saveClient(client: Client): Promise<void> {
  const row = clientToRow(client);
  const { error } = await supabase.from('clients').upsert(row, { onConflict: 'id' });
  if (error) console.error('saveClient error:', error);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) console.error('deleteClient error:', error);
}

// ============ INVOICES ============

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getInvoices error:', error); return []; }
  return (data || []).map(rowToInvoice);
}

export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
  const { data, error } = await supabase.from('invoices').select('*').eq('client_id', clientId);
  if (error) return [];
  return (data || []).map(rowToInvoice);
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  const row = invoiceToRow(invoice);
  const { error } = await supabase.from('invoices').upsert(row, { onConflict: 'id' });
  if (error) console.error('saveInvoice error:', error);
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) console.error('deleteInvoice error:', error);
}

// ============ INTERACTIONS ============

export async function getInteractions(): Promise<Interaction[]> {
  const { data, error } = await supabase.from('interactions').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getInteractions error:', error); return []; }
  return (data || []).map(rowToInteraction);
}

export async function getInteractionsByClient(clientId: string): Promise<Interaction[]> {
  const { data, error } = await supabase.from('interactions').select('*').eq('client_id', clientId);
  if (error) return [];
  return (data || []).map(rowToInteraction);
}

export async function saveInteraction(interaction: Interaction): Promise<void> {
  const row = interactionToRow(interaction);
  const { error } = await supabase.from('interactions').upsert(row, { onConflict: 'id' });
  if (error) console.error('saveInteraction error:', error);
}

// ============ EVENTS ============

export async function getEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
  if (error) { console.error('getEvents error:', error); return []; }
  return (data || []).map(rowToEvent);
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  const row = eventToRow(event);
  const { error } = await supabase.from('events').upsert(row, { onConflict: 'id' });
  if (error) console.error('saveEvent error:', error);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) console.error('deleteEvent error:', error);
}

// ============ CHARGES ============

export async function getCharges(): Promise<Charge[]> {
  const { data, error } = await supabase.from('charges').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getCharges error:', error); return []; }
  return (data || []).map(rowToCharge);
}

export async function saveCharge(charge: Charge): Promise<void> {
  const row = chargeToRow(charge);
  const { error } = await supabase.from('charges').upsert(row, { onConflict: 'id' });
  if (error) console.error('saveCharge error:', error);
}

export async function deleteCharge(id: string): Promise<void> {
  const { error } = await supabase.from('charges').delete().eq('id', id);
  if (error) console.error('deleteCharge error:', error);
}

// ============ PROJECTS (legacy, kept for compatibility) ============

export async function getProjects(): Promise<Project[]> {
  return [];
}

export async function getProjectsByClient(_clientId: string): Promise<Project[]> {
  return [];
}

// ============ UTILS ============

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

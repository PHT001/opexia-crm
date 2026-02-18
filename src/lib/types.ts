export type ClientStatus = 'client' | 'prospect' | 'perdu';

export type ServiceType = 'site-web' | 'chatbot' | 'receptionniste-ia' | 'automatisation' | 'autre';

export type ProjectStatus = 'en-attente' | 'en-cours' | 'termine' | 'annule';

export type InvoiceStatus = 'payee' | 'en-attente' | 'en-retard' | 'annulee';

export type PipelineStage = 'contact' | 'demo' | 'proposition' | 'negociation' | 'signe' | 'perdu';

export type InteractionType = 'appel' | 'email' | 'rdv' | 'note';

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  entreprise: string;
  email: string;
  telephone: string;
  status: ClientStatus;
  pipelineStage: PipelineStage;
  servicesSouscrits: ServiceType[];
  montantMensuel: number;
  dateCreation: string;
  dernierContact: string;
  notes: string;
  adresse?: string;
  siteWeb?: string;
  secteur?: string;
  source?: string;
  avatar?: string;
}

export interface Project {
  id: string;
  clientId: string;
  nom: string;
  type: ServiceType;
  status: ProjectStatus;
  dateDebut: string;
  dateFin?: string;
  deadline: string;
  progression: number;
  description: string;
  montant: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  numero: string;
  montant: number;
  status: InvoiceStatus;
  dateEmission: string;
  dateEcheance: string;
  description: string;
  mois: string;
}

export interface Interaction {
  id: string;
  clientId: string;
  type: InteractionType;
  date: string;
  sujet: string;
  contenu: string;
}

export interface CalendarEvent {
  id: string;
  clientId?: string;
  titre: string;
  date: string;
  heure: string;
  duree: number;
  type: 'rdv' | 'deadline' | 'rappel' | 'autre';
  description?: string;
  couleur?: string;
}

export interface DashboardStats {
  totalClients: number;
  totalProspects: number;
  caMensuel: number;
  caAnnuel: number;
  tauxConversion: number;
  projetsEnCours: number;
  facturesEnAttente: number;
  facturesEnRetard: number;
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  'site-web': 'Site Web',
  'chatbot': 'Chatbot IA',
  'receptionniste-ia': 'Réceptionniste IA',
  'automatisation': 'Automatisation',
  'autre': 'Autre',
};

export const STATUS_LABELS: Record<ClientStatus, string> = {
  'client': 'Client',
  'prospect': 'Prospect',
  'perdu': 'Perdu',
};

export const PIPELINE_LABELS: Record<PipelineStage, string> = {
  'contact': 'Premier Contact',
  'demo': 'Démo',
  'proposition': 'Proposition',
  'negociation': 'Négociation',
  'signe': 'Signé',
  'perdu': 'Perdu',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  'en-attente': 'En attente',
  'en-cours': 'En cours',
  'termine': 'Terminé',
  'annule': 'Annulé',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  'payee': 'Payée',
  'en-attente': 'En attente',
  'en-retard': 'En retard',
  'annulee': 'Annulée',
};

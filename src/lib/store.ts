'use client';

import { Client, Project, Invoice, Interaction, CalendarEvent, Charge } from './types';

const STORAGE_KEYS = {
  clients: 'opexia_clients',
  projects: 'opexia_projects',
  invoices: 'opexia_invoices',
  interactions: 'opexia_interactions',
  events: 'opexia_events',
  charges: 'opexia_charges',
};

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getClients(): Client[] {
  return loadFromStorage<Client>(STORAGE_KEYS.clients);
}

export function getClient(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === client.id);
  if (idx >= 0) {
    clients[idx] = client;
  } else {
    clients.push(client);
  }
  saveToStorage(STORAGE_KEYS.clients, clients);
}

export function deleteClient(id: string): void {
  const clients = getClients().filter(c => c.id !== id);
  saveToStorage(STORAGE_KEYS.clients, clients);
}

export function getProjects(): Project[] {
  return loadFromStorage<Project>(STORAGE_KEYS.projects);
}

export function getProjectsByClient(clientId: string): Project[] {
  return getProjects().filter(p => p.clientId === clientId);
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  saveToStorage(STORAGE_KEYS.projects, projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter(p => p.id !== id);
  saveToStorage(STORAGE_KEYS.projects, projects);
}

export function getInvoices(): Invoice[] {
  return loadFromStorage<Invoice>(STORAGE_KEYS.invoices);
}

export function getInvoicesByClient(clientId: string): Invoice[] {
  return getInvoices().filter(i => i.clientId === clientId);
}

export function saveInvoice(invoice: Invoice): void {
  const invoices = getInvoices();
  const idx = invoices.findIndex(i => i.id === invoice.id);
  if (idx >= 0) {
    invoices[idx] = invoice;
  } else {
    invoices.push(invoice);
  }
  saveToStorage(STORAGE_KEYS.invoices, invoices);
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices().filter(i => i.id !== id);
  saveToStorage(STORAGE_KEYS.invoices, invoices);
}

export function getInteractions(): Interaction[] {
  return loadFromStorage<Interaction>(STORAGE_KEYS.interactions);
}

export function getInteractionsByClient(clientId: string): Interaction[] {
  return getInteractions().filter(i => i.clientId === clientId);
}

export function saveInteraction(interaction: Interaction): void {
  const interactions = getInteractions();
  const idx = interactions.findIndex(i => i.id === interaction.id);
  if (idx >= 0) {
    interactions[idx] = interaction;
  } else {
    interactions.push(interaction);
  }
  saveToStorage(STORAGE_KEYS.interactions, interactions);
}

export function getEvents(): CalendarEvent[] {
  return loadFromStorage<CalendarEvent>(STORAGE_KEYS.events);
}

export function saveEvent(event: CalendarEvent): void {
  const events = getEvents();
  const idx = events.findIndex(e => e.id === event.id);
  if (idx >= 0) {
    events[idx] = event;
  } else {
    events.push(event);
  }
  saveToStorage(STORAGE_KEYS.events, events);
}

export function deleteEvent(id: string): void {
  const events = getEvents().filter(e => e.id !== id);
  saveToStorage(STORAGE_KEYS.events, events);
}

export function getCharges(): Charge[] {
  return loadFromStorage<Charge>(STORAGE_KEYS.charges);
}

export function saveCharge(charge: Charge): void {
  const charges = getCharges();
  const idx = charges.findIndex(c => c.id === charge.id);
  if (idx >= 0) {
    charges[idx] = charge;
  } else {
    charges.push(charge);
  }
  saveToStorage(STORAGE_KEYS.charges, charges);
}

export function deleteCharge(id: string): void {
  const charges = getCharges().filter(c => c.id !== id);
  saveToStorage(STORAGE_KEYS.charges, charges);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

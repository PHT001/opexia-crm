import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const results: Record<string, unknown> = {};

  // 1. Try to create devis table by inserting a dummy record and handling errors
  // First check if table exists by trying to select from it
  const { error: checkError } = await supabase.from('devis').select('id').limit(1);

  if (checkError && checkError.message.includes('devis')) {
    // Table doesn't exist - return SQL for manual execution
    results.devisTableExists = false;
    results.manualSQL = `
-- Run this SQL in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE TABLE IF NOT EXISTS devis (
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

-- Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS lignes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS montant_ht NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS montant_ttc NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS devis_id TEXT;
    `.trim();
  } else {
    results.devisTableExists = true;
  }

  // 2. Check invoices table columns
  const { data: invData, error: invError } = await supabase.from('invoices').select('*').limit(1);
  if (invData && invData.length > 0) {
    const cols = Object.keys(invData[0]);
    results.invoicesColumns = cols;
    results.hasLignesColumn = cols.includes('lignes');
    results.hasMontantHTColumn = cols.includes('montant_ht');
    results.hasMontantTTCColumn = cols.includes('montant_ttc');
    results.hasDevisIdColumn = cols.includes('devis_id');
  } else {
    results.invoicesCheck = invError?.message || 'No invoices found (empty table)';
    // Try inserting a dummy invoice to check columns
    results.invoicesColumnsUnknown = true;
  }

  // 3. Store Facture.net API key
  const { error: apiKeyError } = await supabase.from('api_keys').upsert({
    id: 'facturenet',
    provider: 'facturenet',
    api_key: 'pk_W39W9Lus2otne1oAGh95Kci2',
    label: 'Facture.net',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  results.apiKeyStored = !apiKeyError;
  if (apiKeyError) results.apiKeyError = apiKeyError.message;

  return NextResponse.json(results);
}

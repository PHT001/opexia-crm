import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { fetchProviderUsage, SUPPORTED_PROVIDERS } from '@/lib/providers';

// POST - Fetch usage for all active providers and update charges
export async function POST() {
  const supabase = getServiceSupabase();

  // Get all active API keys
  const { data: apiKeys, error: keysError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('is_active', true);

  if (keysError) return NextResponse.json({ error: keysError.message }, { status: 500 });
  if (!apiKeys || apiKeys.length === 0) {
    return NextResponse.json({ message: 'No active API keys configured', results: [] });
  }

  const results = [];

  for (const key of apiKeys) {
    const usage = await fetchProviderUsage(key.provider, key.api_key);

    // Log usage
    await supabase.from('usage_logs').insert({
      provider: key.provider,
      period: usage.period,
      amount: usage.amount,
      currency: usage.currency,
      details: usage.details || {},
    });

    // Update API key last check
    await supabase
      .from('api_keys')
      .update({
        last_checked: new Date().toISOString(),
        last_usage_amount: usage.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', key.provider);

    // Auto-update charge if linked
    const { data: linkedCharge } = await supabase
      .from('charges')
      .select('*')
      .eq('auto_provider', key.provider)
      .single();

    if (linkedCharge && usage.amount > 0) {
      await supabase
        .from('charges')
        .update({
          montant: usage.amount,
          last_auto_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkedCharge.id);
    } else if (!linkedCharge && usage.amount > 0) {
      // Auto-create charge for this provider
      const providerName = SUPPORTED_PROVIDERS[key.provider as keyof typeof SUPPORTED_PROVIDERS]?.name || key.provider;
      await supabase.from('charges').insert({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        nom: providerName,
        categorie: 'logiciel',
        montant: usage.amount,
        frequence: 'mensuel',
        date_debut: new Date().toISOString().split('T')[0],
        actif: true,
        fournisseur: providerName,
        auto_provider: key.provider,
        auto_api_key_id: key.id,
        last_auto_update: new Date().toISOString(),
      });
    }

    results.push({
      provider: key.provider,
      amount: usage.amount,
      currency: usage.currency,
      period: usage.period,
      error: usage.error,
    });
  }

  return NextResponse.json({
    message: `Fetched usage for ${results.length} provider(s)`,
    results,
    timestamp: new Date().toISOString(),
  });
}

// GET - Get usage history
export async function GET() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('usage_logs')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

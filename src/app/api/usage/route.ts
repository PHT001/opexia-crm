import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { fetchProviderUsage, SUPPORTED_PROVIDERS, ProviderKey } from '@/lib/providers';

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
    return NextResponse.json({ message: 'Aucune clé API active configurée', results: [] });
  }

  const results = [];

  for (const key of apiKeys) {
    const usage = await fetchProviderUsage(key.provider, key.api_key);
    const providerConfig = SUPPORTED_PROVIDERS[key.provider as ProviderKey];
    const providerName = providerConfig?.name || key.provider;
    const providerCategory = providerConfig?.category || 'logiciel';

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

    // Find existing linked charge (by auto_provider OR by fournisseur name)
    let { data: linkedCharge } = await supabase
      .from('charges')
      .select('*')
      .eq('auto_provider', key.provider)
      .single();

    // Also try matching by fournisseur name if no auto_provider link
    if (!linkedCharge) {
      const { data: manualCharge } = await supabase
        .from('charges')
        .select('*')
        .ilike('fournisseur', `%${providerName.split(' ')[0]}%`)
        .single();
      if (manualCharge) {
        linkedCharge = manualCharge;
        // Link it for future auto-updates
        await supabase
          .from('charges')
          .update({ auto_provider: key.provider, auto_api_key_id: key.id })
          .eq('id', manualCharge.id);
      }
    }

    if (linkedCharge) {
      // Update existing charge if we have a real amount
      if (usage.amount > 0) {
        await supabase
          .from('charges')
          .update({
            montant: usage.amount,
            last_auto_update: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notes: `Auto-actualisé le ${new Date().toLocaleDateString('fr-FR')} - ${usage.subscription?.plan || 'API'}`,
          })
          .eq('id', linkedCharge.id);
      } else {
        await supabase
          .from('charges')
          .update({
            last_auto_update: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', linkedCharge.id);
      }
    } else if (usage.keyValid) {
      // Auto-create a new charge for this valid provider
      await supabase.from('charges').insert({
        id: crypto.randomUUID(),
        nom: providerName,
        categorie: providerCategory,
        montant: usage.amount > 0 ? usage.amount : 0,
        frequence: 'mensuel',
        date_debut: new Date().toISOString().split('T')[0],
        actif: true,
        fournisseur: providerName,
        auto_provider: key.provider,
        auto_api_key_id: key.id,
        last_auto_update: new Date().toISOString(),
        notes: usage.amount > 0
          ? `Auto-détecté: ${usage.amount} €/mois - ${usage.subscription?.plan || 'API'}`
          : `Clé API valide (${usage.subscription?.plan || 'API'}) - montant à renseigner manuellement`,
      });
    }

    results.push({
      provider: key.provider,
      name: providerName,
      amount: usage.amount,
      currency: usage.currency,
      period: usage.period,
      keyValid: usage.keyValid,
      subscription: usage.subscription,
      error: usage.error,
    });
  }

  return NextResponse.json({
    message: `${results.length} provider(s) vérifiés. ${results.filter(r => r.amount > 0).length} avec coûts auto-détectés.`,
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

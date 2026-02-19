import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { fetchProviderUsage, SUPPORTED_PROVIDERS, ProviderKey } from '@/lib/providers';

// This endpoint is called by Vercel Cron daily at 6am
export async function GET(req: NextRequest) {
  // Verify cron secret (optional, for security)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  // Get all active API keys
  const { data: apiKeys, error: keysError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('is_active', true);

  if (keysError) return NextResponse.json({ error: keysError.message }, { status: 500 });
  if (!apiKeys || apiKeys.length === 0) {
    return NextResponse.json({ message: 'No active API keys', updated: 0 });
  }

  let updated = 0;
  const results = [];

  for (const key of apiKeys) {
    try {
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

      // Update API key record with last check info
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

      // Also try matching by fournisseur if no auto_provider link
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
        // Update existing charge only if we have a real amount from billing API
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
          updated++;
        } else {
          // Just update the last check timestamp
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
        updated++;
      }

      results.push({
        provider: key.provider,
        amount: usage.amount,
        keyValid: usage.keyValid,
        subscription: usage.subscription,
        error: usage.error,
      });
    } catch (e) {
      console.error(`Error fetching usage for ${key.provider}:`, e);
      results.push({ provider: key.provider, error: String(e) });
    }
  }

  return NextResponse.json({
    message: `Cron completed. ${updated} charge(s) créées/mises à jour.`,
    providers: apiKeys.length,
    updated,
    results,
    timestamp: new Date().toISOString(),
  });
}

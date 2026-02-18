import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { fetchProviderUsage, SUPPORTED_PROVIDERS } from '@/lib/providers';

// This endpoint is called by Vercel Cron every 6 hours
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

  for (const key of apiKeys) {
    try {
      const usage = await fetchProviderUsage(key.provider, key.api_key);

      // Log usage
      await supabase.from('usage_logs').insert({
        provider: key.provider,
        period: usage.period,
        amount: usage.amount,
        currency: usage.currency,
        details: usage.details || {},
      });

      // Update API key record
      await supabase
        .from('api_keys')
        .update({
          last_checked: new Date().toISOString(),
          last_usage_amount: usage.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('provider', key.provider);

      // Update linked charge
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
        updated++;
      } else if (!linkedCharge && usage.amount > 0) {
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
        updated++;
      }
    } catch (e) {
      console.error(`Error fetching usage for ${key.provider}:`, e);
    }
  }

  return NextResponse.json({
    message: `Cron completed. Updated ${updated} charge(s).`,
    providers: apiKeys.length,
    updated,
    timestamp: new Date().toISOString(),
  });
}

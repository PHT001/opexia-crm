import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET - List all API keys (with masked keys for display)
export async function GET() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, provider, api_key, label, is_active, last_checked, last_usage_amount, created_at')
    .order('provider');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data || [] });
}

// POST - Add or update an API key
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { provider, api_key, label } = body;

  if (!provider || !api_key) {
    return NextResponse.json({ error: 'provider and api_key are required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('api_keys')
    .upsert({
      provider,
      api_key,
      label: label || provider,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE - Remove an API key
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider');

  if (!provider) {
    return NextResponse.json({ error: 'provider is required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('api_keys').delete().eq('provider', provider);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

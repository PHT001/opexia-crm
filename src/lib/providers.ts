// Provider usage fetchers - each function returns the current month's cost/subscription info

export interface UsageResult {
  amount: number;
  currency: string;
  period: string;
  subscription?: {
    plan?: string;
    status?: string;
    monthlyPrice?: number;
  };
  details?: Record<string, unknown>;
  error?: string;
  keyValid?: boolean;
}

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ============ ANTHROPIC (Claude) ============
// No public billing API - we validate the key and return subscription info
export async function fetchAnthropicUsage(apiKey: string): Promise<UsageResult> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (res.ok || res.status === 400) {
      return {
        amount: 0,
        currency: 'EUR',
        period: getCurrentPeriod(),
        keyValid: true,
        subscription: {
          status: 'active',
          plan: 'API',
        },
        details: { note: 'Clé API valide. Anthropic n\'a pas d\'API de billing publique - montant à renseigner manuellement.' },
      };
    }

    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), keyValid: false, error: 'Clé API invalide' };
  } catch (e) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ MISTRAL ============
// No public billing API - we validate the key via models endpoint
export async function fetchMistralUsage(apiKey: string): Promise<UsageResult> {
  try {
    const modelsRes = await fetch('https://api.mistral.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (modelsRes.ok) {
      return {
        amount: 0,
        currency: 'EUR',
        period: getCurrentPeriod(),
        keyValid: true,
        subscription: {
          status: 'active',
          plan: 'API',
        },
        details: { note: 'Clé API valide. Mistral n\'a pas d\'API de billing publique - montant à renseigner manuellement.' },
      };
    }

    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), keyValid: false, error: 'Clé API invalide' };
  } catch (e) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ TWILIO ============
// ✅ Has a real billing API - returns actual usage costs
export async function fetchTwilioUsage(apiKey: string): Promise<UsageResult> {
  try {
    const [accountSid, authToken] = apiKey.split(':');
    if (!accountSid || !authToken) {
      return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: 'Format requis : ACCOUNT_SID:AUTH_TOKEN' };
    }

    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = now.toISOString().split('T')[0];

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Usage/Records.json?StartDate=${startDate}&EndDate=${endDate}`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const totalPrice = data.usage_records?.reduce((sum: number, record: { price: string }) =>
        sum + parseFloat(record.price || '0'), 0) || 0;

      // Get breakdown of costs
      const breakdown = data.usage_records
        ?.filter((r: { price: string }) => parseFloat(r.price || '0') > 0)
        ?.map((r: { category: string; price: string; usage: string; description: string }) => ({
          category: r.category,
          description: r.description,
          price: parseFloat(r.price),
          usage: r.usage,
        })) || [];

      return {
        amount: Math.round(totalPrice * 100) / 100,
        currency: 'EUR',
        period: getCurrentPeriod(),
        keyValid: true,
        subscription: {
          status: 'active',
          plan: 'Pay-as-you-go',
        },
        details: { breakdown, total_records: data.usage_records?.length || 0 },
      };
    }

    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), keyValid: false, error: 'Échec de récupération Twilio' };
  } catch (e) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ ELEVENLABS ============
// ✅ Has subscription API - returns plan info and invoice amount
export async function fetchElevenLabsUsage(apiKey: string): Promise<UsageResult> {
  try {
    const subRes = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
    });

    if (subRes.ok) {
      const subData = await subRes.json();
      const monthlyPrice = subData.next_invoice?.amount_due_cents
        ? subData.next_invoice.amount_due_cents / 100
        : 0;

      return {
        amount: monthlyPrice,
        currency: 'EUR',
        period: getCurrentPeriod(),
        keyValid: true,
        subscription: {
          plan: subData.tier,
          status: subData.status || 'active',
          monthlyPrice,
        },
        details: {
          tier: subData.tier,
          character_count: subData.character_count,
          character_limit: subData.character_limit,
          billing_period: subData.billing_period,
          next_invoice_cents: subData.next_invoice?.amount_due_cents,
          next_reset: subData.next_character_count_reset_unix,
        },
      };
    }

    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), keyValid: false, error: 'Échec de récupération ElevenLabs' };
  } catch (e) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ GOOGLE (Gemini) ============
// No billing API via simple API key - Google Cloud billing requires OAuth
export async function fetchGeminiUsage(apiKey: string): Promise<UsageResult> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

    if (res.ok) {
      return {
        amount: 0,
        currency: 'EUR',
        period: getCurrentPeriod(),
        keyValid: true,
        subscription: {
          status: 'active',
          plan: 'API',
        },
        details: { note: 'Clé API valide. Google Cloud Billing nécessite OAuth - montant à renseigner manuellement.' },
      };
    }

    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), keyValid: false, error: 'Clé API invalide' };
  } catch (e) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ OPENAI ============
export async function fetchOpenAIUsage(apiKey: string): Promise<UsageResult> {
  try {
    // Try the costs API (new endpoint)
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Validate key first
    const modelsRes = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (modelsRes.ok) {
      // Try billing usage endpoint
      const usageRes = await fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${now.toISOString().split('T')[0]}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (usageRes.ok) {
        const data = await usageRes.json();
        return {
          amount: (data.total_usage || 0) / 100,
          currency: 'EUR',
          period: getCurrentPeriod(),
          keyValid: true,
          subscription: { status: 'active', plan: 'API' },
          details: data,
        };
      }

      return {
        amount: 0,
        currency: 'EUR',
        period: getCurrentPeriod(),
        keyValid: true,
        subscription: { status: 'active', plan: 'API' },
        details: { note: 'Clé API valide. Billing API non accessible avec cette clé.' },
      };
    }

    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), keyValid: false, error: 'Clé API invalide' };
  } catch (e) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ SUPABASE ============
// ✅ Has Management API - returns projects and compute costs
export async function fetchSupabaseUsage(apiKey: string): Promise<UsageResult> {
  try {
    // Get all projects
    const projRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!projRes.ok) {
      return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), keyValid: false, error: 'Token Supabase invalide' };
    }

    const projects = await projRes.json();
    const activeProjects = projects.filter((p: { status: string }) =>
      p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE_UNHEALTHY'
    );

    // Base plan cost (Pro = $25/month)
    let totalCost = 25; // Pro plan base
    const projectDetails: Array<{ name: string; compute: string; computeCost: number }> = [];

    // Get compute addons for each project
    for (const p of activeProjects) {
      try {
        const billRes = await fetch(`https://api.supabase.com/v1/projects/${p.id}/billing/addons`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (billRes.ok) {
          const billing = await billRes.json();
          const computeAddon = billing.selected_addons?.find(
            (a: { type: string }) => a.type === 'compute_instance'
          );

          if (computeAddon) {
            const hourlyRate = computeAddon.variant?.price?.amount || 0;
            const monthlyCost = Math.round(hourlyRate * 730 * 100) / 100; // ~730 hours/month
            totalCost += monthlyCost;
            projectDetails.push({
              name: p.name,
              compute: computeAddon.variant?.name || 'Custom',
              computeCost: monthlyCost,
            });
          } else {
            projectDetails.push({
              name: p.name,
              compute: 'Nano (inclus)',
              computeCost: 0,
            });
          }
        }
      } catch {
        projectDetails.push({
          name: p.name,
          compute: 'Inconnu',
          computeCost: 0,
        });
      }
    }

    // Subtract $10 compute credits included in Pro plan
    const computeTotal = projectDetails.reduce((s, p) => s + p.computeCost, 0);
    const computeCredits = Math.min(computeTotal, 10);
    totalCost -= computeCredits;

    return {
      amount: Math.round(totalCost * 100) / 100,
      currency: 'EUR',
      period: getCurrentPeriod(),
      keyValid: true,
      subscription: {
        plan: 'Pro',
        status: 'active',
        monthlyPrice: totalCost,
      },
      details: {
        plan_base: 25,
        compute_credits: -computeCredits,
        total_projects: activeProjects.length,
        projects: projectDetails,
      },
    };
  } catch (e) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ DISPATCHER ============
export const SUPPORTED_PROVIDERS = {
  'anthropic': { name: 'Claude', fetch: fetchAnthropicUsage, category: 'logiciel' as const },
  'mistral': { name: 'Mistral AI', fetch: fetchMistralUsage, category: 'logiciel' as const },
  'twilio': { name: 'Twilio', fetch: fetchTwilioUsage, category: 'telephonie' as const },
  'elevenlabs': { name: 'ElevenLabs', fetch: fetchElevenLabsUsage, category: 'logiciel' as const },
  'gemini': { name: 'Google Gemini', fetch: fetchGeminiUsage, category: 'logiciel' as const },
  'openai': { name: 'OpenAI', fetch: fetchOpenAIUsage, category: 'logiciel' as const },
  'supabase': { name: 'Supabase', fetch: fetchSupabaseUsage, category: 'hebergement' as const },
} as const;

export type ProviderKey = keyof typeof SUPPORTED_PROVIDERS;

export async function fetchProviderUsage(provider: string, apiKey: string): Promise<UsageResult> {
  const providerConfig = SUPPORTED_PROVIDERS[provider as ProviderKey];
  if (!providerConfig) {
    return { amount: 0, currency: 'EUR', period: getCurrentPeriod(), error: `Provider inconnu: ${provider}` };
  }
  return providerConfig.fetch(apiKey);
}

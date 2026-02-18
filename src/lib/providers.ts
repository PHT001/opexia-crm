// Provider usage fetchers - each function returns the current month's cost

export interface UsageResult {
  amount: number;
  currency: string;
  period: string;
  details?: Record<string, unknown>;
  error?: string;
}

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ============ ANTHROPIC (Claude) ============
export async function fetchAnthropicUsage(apiKey: string): Promise<UsageResult> {
  try {
    // Anthropic usage API - get current month billing
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const res = await fetch(`https://api.anthropic.com/v1/messages/count_tokens`, {
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

    // Anthropic doesn't have a public billing API yet, so we try the admin API
    const billingRes = await fetch('https://api.anthropic.com/v1/organizations/usage', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (billingRes.ok) {
      const data = await billingRes.json();
      return {
        amount: data.total_cost || 0,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: data,
      };
    }

    // Fallback: check if API key is valid
    if (res.ok || res.status === 400) {
      return {
        amount: 0,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: { note: 'API key valid, billing API not available yet' },
      };
    }

    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: 'Invalid API key' };
  } catch (e) {
    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ MISTRAL ============
export async function fetchMistralUsage(apiKey: string): Promise<UsageResult> {
  try {
    const res = await fetch('https://api.mistral.ai/v1/usage', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        amount: data.total_cost || data.cost || 0,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: data,
      };
    }

    // Try models endpoint to validate key
    const modelsRes = await fetch('https://api.mistral.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (modelsRes.ok) {
      return {
        amount: 0,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: { note: 'API key valid' },
      };
    }

    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: 'Invalid API key or no usage data' };
  } catch (e) {
    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ TWILIO ============
export async function fetchTwilioUsage(apiKey: string): Promise<UsageResult> {
  try {
    // Twilio uses Account SID:Auth Token format
    const [accountSid, authToken] = apiKey.split(':');
    if (!accountSid || !authToken) {
      return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: 'Format: ACCOUNT_SID:AUTH_TOKEN' };
    }

    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Usage/Records.json?StartDate=${startDate}&EndDate=${endDate}&Category=totalprice`,
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
      return {
        amount: totalPrice,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: data,
      };
    }

    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: 'Failed to fetch Twilio usage' };
  } catch (e) {
    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ ELEVENLABS ============
export async function fetchElevenLabsUsage(apiKey: string): Promise<UsageResult> {
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/usage/character-stats', {
      headers: { 'xi-api-key': apiKey },
    });

    const subRes = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
    });

    if (subRes.ok) {
      const subData = await subRes.json();
      const invoiceAmount = subData.next_invoice?.amount_due_cents
        ? subData.next_invoice.amount_due_cents / 100
        : subData.character_limit ? 0 : 0;

      return {
        amount: invoiceAmount || (subData.tier === 'free' ? 0 : subData.next_invoice?.amount_due_cents / 100 || 0),
        currency: 'USD',
        period: getCurrentPeriod(),
        details: {
          tier: subData.tier,
          character_count: subData.character_count,
          character_limit: subData.character_limit,
          next_reset: subData.next_character_count_reset_unix,
        },
      };
    }

    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: 'Failed to fetch ElevenLabs usage' };
  } catch (e) {
    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ GOOGLE (Gemini) ============
export async function fetchGeminiUsage(apiKey: string): Promise<UsageResult> {
  try {
    // Validate key by listing models
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

    if (res.ok) {
      return {
        amount: 0,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: { note: 'API key valid. Google Cloud billing API requires separate OAuth setup.' },
      };
    }

    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: 'Invalid API key' };
  } catch (e) {
    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ OPENAI ============
export async function fetchOpenAIUsage(apiKey: string): Promise<UsageResult> {
  try {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const res = await fetch(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${now.toISOString().split('T')[0]}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        amount: (data.total_usage || 0) / 100,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: data,
      };
    }

    // Validate key
    const modelsRes = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (modelsRes.ok) {
      return {
        amount: 0,
        currency: 'USD',
        period: getCurrentPeriod(),
        details: { note: 'API key valid' },
      };
    }

    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: 'Invalid API key' };
  } catch (e) {
    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: String(e) };
  }
}

// ============ DISPATCHER ============
export const SUPPORTED_PROVIDERS = {
  'anthropic': { name: 'Anthropic (Claude)', fetch: fetchAnthropicUsage },
  'mistral': { name: 'Mistral AI', fetch: fetchMistralUsage },
  'twilio': { name: 'Twilio', fetch: fetchTwilioUsage },
  'elevenlabs': { name: 'ElevenLabs', fetch: fetchElevenLabsUsage },
  'gemini': { name: 'Google Gemini', fetch: fetchGeminiUsage },
  'openai': { name: 'OpenAI', fetch: fetchOpenAIUsage },
} as const;

export type ProviderKey = keyof typeof SUPPORTED_PROVIDERS;

export async function fetchProviderUsage(provider: string, apiKey: string): Promise<UsageResult> {
  const providerConfig = SUPPORTED_PROVIDERS[provider as ProviderKey];
  if (!providerConfig) {
    return { amount: 0, currency: 'USD', period: getCurrentPeriod(), error: `Unknown provider: ${provider}` };
  }
  return providerConfig.fetch(apiKey);
}

const VAPI_BASE = 'https://api.vapi.ai';

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

const VAPI_WEBHOOK_URL = process.env.VAPI_WEBHOOK_URL || '';

export async function importPhoneNumber(number: string, twilioSid: string, name = '') {
  const body: Record<string, any> = {
    provider: 'twilio',
    number,
    twilioPhoneNumberSid: twilioSid,
    name,
  };

  // If a webhook URL is configured, set the number in dynamic mode so Vapi
  // calls our assistant-request webhook to pick the per-company voice/prompt.
  if (VAPI_WEBHOOK_URL) {
    body.serverUrl = VAPI_WEBHOOK_URL;
    if (process.env.VAPI_WEBHOOK_SECRET) {
      body.serverUrlSecret = process.env.VAPI_WEBHOOK_SECRET;
    }
  }

  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vapi import number failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function listPhoneNumbers() {
  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vapi list numbers failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function getPhoneNumber(id: string) {
  const res = await fetch(`${VAPI_BASE}/phone-number/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vapi get number failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function updatePhoneNumber(id: string, data: Record<string, any>) {
  const res = await fetch(`${VAPI_BASE}/phone-number/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vapi update number failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function deletePhoneNumber(id: string) {
  const res = await fetch(`${VAPI_BASE}/phone-number/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vapi delete number failed (${res.status}): ${err}`);
  }
  return res.json();
}

const VAPI_BASE = 'https://api.vapi.ai';

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function buyPhoneNumber(areaCode = '901', country = 'US', name = '') {
  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      provider: 'twilio',
      areaCode,
      country,
      name,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vapi buy number failed (${res.status}): ${err}`);
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

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';

const client = twilio(accountSid, authToken);

export async function lookupPhone(phone: string): Promise<{ valid: boolean; countryCode?: string; formatted?: string }> {
  try {
    const response = await client.lookups.v2.phoneNumbers(phone).fetch();
    return { valid: response.valid, countryCode: response.countryCode, formatted: response.phoneNumber };
  } catch {
    return { valid: false };
  }
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });
    return true;
  } catch (err) {
    console.error('[twilio/sendSMS] Error:', err);
    return false;
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

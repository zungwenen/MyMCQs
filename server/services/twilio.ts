import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendOTP(phoneNumber: string, otp: string): Promise<{ via: 'whatsapp' | 'sms' }> {
  const client = await getTwilioClient();
  const from = await getTwilioFromPhoneNumber();

  try {
    // Try WhatsApp first
    await client.messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${phoneNumber}`,
      body: `Your Easyread IQ verification code is: ${otp}. Valid for 10 minutes.`,
    });
    return { via: 'whatsapp' };
  } catch (error) {
    // Fallback to SMS
    try {
      await client.messages.create({
        from: from,
        to: phoneNumber,
        body: `Your Easyread IQ verification code is: ${otp}. Valid for 10 minutes.`,
      });
      return { via: 'sms' };
    } catch (smsError) {
      throw new Error('Failed to send OTP via WhatsApp or SMS');
    }
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

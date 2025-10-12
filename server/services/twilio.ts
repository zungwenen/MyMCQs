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
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const whatsappTemplateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

  // Try WhatsApp with Content Template first
  if (whatsappNumber && whatsappTemplateSid) {
    try {
      console.log(`[Twilio] Attempting WhatsApp OTP to ${phoneNumber} using template ${whatsappTemplateSid}`);
      await client.messages.create({
        from: `whatsapp:${whatsappNumber}`,
        to: `whatsapp:${phoneNumber}`,
        contentSid: whatsappTemplateSid,
        contentVariables: JSON.stringify({
          '1': otp
        })
      });
      console.log(`[Twilio] WhatsApp OTP sent successfully to ${phoneNumber}`);
      return { via: 'whatsapp' };
    } catch (whatsappError: any) {
      console.error(`[Twilio] WhatsApp failed for ${phoneNumber}:`, {
        code: whatsappError.code,
        message: whatsappError.message,
        status: whatsappError.status
      });
      // Fall through to SMS
    }
  } else {
    console.warn('[Twilio] WhatsApp credentials not configured, skipping WhatsApp delivery');
  }

  // Fallback to SMS
  try {
    console.log(`[Twilio] Attempting SMS OTP to ${phoneNumber}`);
    await client.messages.create({
      from: from,
      to: phoneNumber,
      body: `Your Easyread IQ verification code is: ${otp}. Valid for 10 minutes.`,
    });
    console.log(`[Twilio] SMS OTP sent successfully to ${phoneNumber}`);
    return { via: 'sms' };
  } catch (smsError: any) {
    console.error(`[Twilio] SMS failed for ${phoneNumber}:`, {
      code: smsError.code,
      message: smsError.message,
      status: smsError.status
    });
    throw new Error(`Failed to send OTP: ${smsError.message || 'Unknown error'}`);
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

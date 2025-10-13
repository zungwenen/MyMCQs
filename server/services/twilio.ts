import twilio from 'twilio';

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
  }

  return twilio(accountSid, authToken);
}

export function getTwilioFromPhoneNumber() {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!phoneNumber) {
    throw new Error('Twilio phone number not configured. Please set TWILIO_PHONE_NUMBER environment variable.');
  }

  return phoneNumber;
}

export async function sendOTP(phoneNumber: string, otp: string): Promise<{ via: 'whatsapp' | 'sms' }> {
  const client = getTwilioClient();
  const from = getTwilioFromPhoneNumber();
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

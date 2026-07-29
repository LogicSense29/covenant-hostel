import twilio from 'twilio';

// Initialize Twilio client
// We check if the environment variables exist before initializing to prevent crashes if they aren't set yet.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. 'whatsapp:+14155238886'

let client = null;
try {
  if (accountSid && authToken && accountSid.startsWith("AC")) {
    client = twilio(accountSid, authToken);
  }
} catch (e) {
  console.warn("Failed to initialize Twilio client:", e.message);
}

/**
 * Sends a WhatsApp message using Twilio.
 * 
 * @param {Object} params
 * @param {string} params.to - The destination phone number (e.g. '+2348012345678')
 * @param {string} params.body - The message content
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function sendWhatsAppMessage({ to, body }) {
  // USER REQUESTED TO COMMENT OUT WHATSAPP
  console.log("WhatsApp message skipped (commented out by request).");
  return;
  
  if (!client) {
    console.warn("Twilio WhatsApp is not configured. Missing account SID or Auth Token.");
    return false;
  }

  if (!fromNumber) {
    console.warn("Twilio WhatsApp From Number is missing in environment variables.");
    return false;
  }

  if (!to) {
    console.warn("No destination phone number provided for WhatsApp message.");
    return false;
  }

  // Ensure the 'to' number has the 'whatsapp:' prefix required by Twilio Sandbox
  // Our database already stores numbers as +234XXXXXXXXXX, so we just prefix it.
  let formattedTo = to;
  if (!formattedTo.startsWith('whatsapp:')) {
    formattedTo = `whatsapp:${formattedTo}`;
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
      to: formattedTo
    });
    
    console.log(`WhatsApp message sent successfully to ${to}. Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${to}:`, error.message || error);
    return false;
  }
}

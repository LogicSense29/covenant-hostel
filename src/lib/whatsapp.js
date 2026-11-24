import twilio from 'twilio';

// Initialize Twilio client
// We check if the environment variables exist before initializing to prevent crashes if they aren't set yet.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. 'whatsapp:+19067676366'

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
 * Supports both raw text (for testing/sandbox) and approved templates (for production).
 * 
 * @param {Object} params
 * @param {string} params.to - The destination phone number (e.g. '+2348012345678')
 * @param {string} [params.body] - The message content (for raw text messages)
 * @param {string} [params.contentSid] - The approved template SID (e.g. 'HXxxxxx...')
 * @param {Object} [params.contentVariables] - Variables for the template (e.g. {"1": "John", "2": "Room 24"})
 * @param {Object} [params.buttonVariables] - Button URL variables (e.g. {"1": "https://example.com/resume/123"})
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function sendWhatsAppMessage({ to, body, contentSid, contentVariables, buttonVariables }) {
  if (!client) {
    console.warn("Twilio WhatsApp is not configured. Missing account SID or Auth Token.");
    return false;
  }

  if (!fromNumber) {
    console.warn("Twilio WhatsApp From Number is missing in environment variables.");
    return false;
  }

  if (typeof to !== "string" || !/^(whatsapp:)?\+[1-9]\d{1,14}$/.test(to)) {
    console.warn("No destination phone number provided for WhatsApp message.");
    return false;
  }

  // Ensure the 'to' number has the 'whatsapp:' prefix required by Twilio
  // Our database already stores numbers as +234XXXXXXXXXX, so we just prefix it.
  let formattedTo = to;
  if (!formattedTo.startsWith('whatsapp:')) {
    formattedTo = `whatsapp:${formattedTo}`;
  }

  try {
    const messageParams = {
      from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
      to: formattedTo
    };

    // Use template if contentSid is provided, otherwise use raw body text
    if (contentSid) {
      // WhatsApp Business API with approved template
      if (!/^HX[0-9a-f]{32}$/i.test(contentSid)) return false;
      messageParams.contentSid = contentSid;
      
      // Merge body variables and button variables
      const allVariables = { ...contentVariables };
      
      // If button variables exist, add them with proper Twilio format
      if (buttonVariables && Object.keys(buttonVariables).length > 0) {
        Object.entries(buttonVariables).forEach(([key, value]) => {
          // Button parameters are typically indexed starting after body variables
          allVariables[key] = value;
        });
      }
      
      if (allVariables && Object.keys(allVariables).length > 0) {
        const variables = Object.entries(allVariables);
        if (variables.some(([key, value]) => !/^[1-9]\d*$/.test(key) ||
          (typeof value !== "string" && typeof value !== "number") || !String(value).trim())) {
          return false;
        }
        messageParams.contentVariables = JSON.stringify(Object.fromEntries(
          variables.map(([key, value]) => [key, String(value)])
        ));
      }
    } else if (body) {
      // Raw text message (for sandbox/testing)
      messageParams.body = body;
    } else {
      console.warn("No message body or template provided for WhatsApp message.");
      return false;
    }

    await client.messages.create(messageParams);
    return true;
  } catch (error) {
    console.error("Twilio rejected the WhatsApp request.", error.code || error.status);
    return false;
  }
}

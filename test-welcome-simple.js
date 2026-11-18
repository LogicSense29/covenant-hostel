/**
 * Simple WhatsApp Welcome Test (No Variables)
 * For templates that have no {{1}}, {{2}} placeholders
 * 
 * Usage: node test-welcome-simple.js
 */

import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const welcomeTenantSid = process.env.WHATSAPP_TEMPLATE_WELCOME_TENANT;

const TEST_NUMBER = "+2347061608636"; // Your number

async function testSimpleWelcome() {
  console.log("🧪 Testing Simple Welcome Template (No Variables)...\n");

  if (!accountSid || !authToken || !fromNumber || !welcomeTenantSid) {
    console.error("❌ Missing credentials or template SID");
    process.exit(1);
  }

  console.log("✅ All credentials found");
  console.log(`📱 From: ${fromNumber}`);
  console.log(`📱 To: ${TEST_NUMBER}`);
  console.log(`📄 Template SID: ${welcomeTenantSid}\n`);

  try {
    const client = twilio(accountSid, authToken);

    const formattedFrom = fromNumber.startsWith('whatsapp:') 
      ? fromNumber 
      : `whatsapp:${fromNumber}`;
    const formattedTo = TEST_NUMBER.startsWith('whatsapp:') 
      ? TEST_NUMBER 
      : `whatsapp:${TEST_NUMBER}`;

    console.log("📤 Sending template message (NO variables)...\n");

    // Send WITHOUT contentVariables since template has none
    const message = await client.messages.create({
      contentSid: welcomeTenantSid,
      from: formattedFrom,
      to: formattedTo
      // No contentVariables!
    });

    console.log("✅ Message sent successfully!\n");
    console.log("Message Details:");
    console.log("- SID:", message.sid);
    console.log("- Status:", message.status);
    console.log("- From:", message.from);
    console.log("- To:", message.to);
    
    if (message.errorCode) {
      console.log("\n⚠️  Error Code:", message.errorCode);
      console.log("Error Message:", message.errorMessage);
    } else {
      console.log("\n✨ Check your WhatsApp now!");
      console.log("If still not received after 1 minute:");
      console.log("1. Run: node check-twilio-logs.js");
      console.log("2. Check: https://console.twilio.com/us1/monitor/logs/messaging");
    }

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error:", error.message);
    
    if (error.code) {
      console.error("Error Code:", error.code);
    }
    
    process.exit(1);
  }
}

testSimpleWelcome();

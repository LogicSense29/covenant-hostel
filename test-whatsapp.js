/**
 * Quick WhatsApp Test Script
 * Tests Twilio WhatsApp integration
 * 
 * Usage: node test-whatsapp.js
 */

import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Test recipient (change this to your WhatsApp number for testing)
const TEST_NUMBER = "+2347061608636"; // Default to management number
// const TEST_NUMBER = "+2348090791947";
async function testWhatsApp() {
  console.log("🧪 Testing WhatsApp Integration...\n");

  // Validate credentials
  if (!accountSid || !authToken || !fromNumber) {
    console.error("❌ Missing Twilio credentials in .env file");
    console.log("\nRequired variables:");
    console.log("- TWILIO_ACCOUNT_SID:", accountSid ? "✅" : "❌");
    console.log("- TWILIO_AUTH_TOKEN:", authToken ? "✅" : "❌");
    console.log("- TWILIO_WHATSAPP_NUMBER:", fromNumber ? "✅" : "❌");
    process.exit(1);
  }

  console.log("✅ Credentials found");
  console.log(`📱 From: ${fromNumber}`);
  console.log(`📱 To: ${TEST_NUMBER}\n`);

  try {
    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Format numbers for WhatsApp
    const formattedFrom = fromNumber.startsWith('whatsapp:') 
      ? fromNumber 
      : `whatsapp:${fromNumber}`;
    const formattedTo = TEST_NUMBER.startsWith('whatsapp:') 
      ? TEST_NUMBER 
      : `whatsapp:${TEST_NUMBER}`;

    console.log("📤 Sending test message...\n");

    // Send test message
    const message = await client.messages.create({
      body: `🏠 Covenant Hostel Test Message\n\nThis is a test of the automated WhatsApp notification system.\n\nTime: ${new Date().toLocaleString()}\n\n✅ If you received this, WhatsApp integration is working!`,
      from: formattedFrom,
      to: formattedTo
    });

    console.log("✅ Message sent successfully!\n");
    console.log("Message Details:");
    console.log("- SID:", message.sid);
    console.log("- Status:", message.status);
    console.log("- From:", message.from);
    console.log("- To:", message.to);
    console.log("- Created:", message.dateCreated);
    
    if (message.errorCode) {
      console.log("\n⚠️  Error Code:", message.errorCode);
      console.log("Error Message:", message.errorMessage);
    }

    console.log("\n✨ Test completed successfully!");
    console.log("\n💡 Note: Check your WhatsApp to confirm message delivery.");
    console.log("   For Twilio Sandbox, you must first join the sandbox by sending");
    console.log("   'join <sandbox-keyword>' to the Twilio WhatsApp number.");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error:", error.message);
    
    if (error.code) {
      console.error("Error Code:", error.code);
      
      // Specific error handling
      if (error.code === 63016 || error.code === 63007) {
        console.log("\n⚠️  WhatsApp Business Template Issue");
        console.log("WhatsApp Business API requires approved message templates.");
        console.log("\n📝 To fix:");
        console.log("1. Go to: https://console.twilio.com/us1/develop/sms/content-editor");
        console.log("2. Create and submit templates for approval");
        console.log("3. Wait 15-60 minutes for Facebook approval");
        console.log("4. Use approved templates in production");
      } else if (error.code === 21408) {
        console.log("\n⚠️  Authentication Failed");
        console.log("Check your Twilio credentials are correct and active.");
      } else if (error.code === 21610) {
        console.log("\n⚠️  Number Not Verified");
        console.log("Add recipient to verified numbers or upgrade to paid account.");
      }
    }
    
    if (error.moreInfo) {
      console.error("\n📚 More Info:", error.moreInfo);
    }

    console.log("\n🔧 General Troubleshooting:");
    console.log("1. Check Twilio logs: https://console.twilio.com/us1/monitor/logs/messaging");
    console.log("2. Verify credentials in .env are active");
    console.log("3. For WhatsApp Business: Ensure templates are approved");
    console.log("4. Check account balance and status");
    console.log("5. Verify recipient number format: +2348XXXXXXXXX");
    
    process.exit(1);
  }
}

// Run the test
testWhatsApp();

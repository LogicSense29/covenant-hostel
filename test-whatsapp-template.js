/**
 * WhatsApp Template Test Script
 * Tests using approved WhatsApp Business API templates
 * 
 * Usage: node test-whatsapp-template.js
 */

import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Template SID from .env
const welcomeTenantSid = process.env.WHATSAPP_TEMPLATE_WELCOME_TENANT;

// Test recipient (change this to your WhatsApp number for testing)
const TEST_NUMBER = "+2347061608636";
// const TEST_NUMBER = "+2348090791947";

async function testWhatsAppTemplate() {
  console.log("🧪 Testing WhatsApp Template Integration...\n");

  // Validate credentials
  if (!accountSid || !authToken || !fromNumber) {
    console.error("❌ Missing Twilio credentials in .env file");
    console.log("\nRequired variables:");
    console.log("- TWILIO_ACCOUNT_SID:", accountSid ? "✅" : "❌");
    console.log("- TWILIO_AUTH_TOKEN:", authToken ? "✅" : "❌");
    console.log("- TWILIO_WHATSAPP_NUMBER:", fromNumber ? "✅" : "❌");
    process.exit(1);
  }

  if (!welcomeTenantSid) {
    console.error("❌ Missing template SID in .env file");
    console.log("\nRequired variable:");
    console.log("- WHATSAPP_TEMPLATE_WELCOME_TENANT:", welcomeTenantSid ? "✅" : "❌");
    console.log("\nPlease add to .env:");
    console.log('WHATSAPP_TEMPLATE_WELCOME_TENANT="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"');
    console.log("\nGet SID from: https://console.twilio.com/us1/develop/sms/content-editor");
    process.exit(1);
  }

  console.log("✅ Credentials found");
  console.log(`📱 From: ${fromNumber}`);
  console.log(`📱 To: ${TEST_NUMBER}`);
  console.log(`📄 Template SID: ${welcomeTenantSid}\n`);

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

    console.log("📤 Sending template message...\n");

    // Sample template variables for welcome_new_tenant
    const templateVariables = {
      "1": "Test User",
      "2": "Room 24"
    };

    console.log("Template Variables:");
    console.log(JSON.stringify(templateVariables, null, 2));
    console.log();

    // Send test message using template
    const message = await client.messages.create({
      contentSid: welcomeTenantSid,
      from: formattedFrom,
      to: formattedTo,
      contentVariables: JSON.stringify(templateVariables)
    });

    console.log("✅ Message sent successfully!\n");
    console.log("Message Details:");
    console.log("- SID:", message.sid);
    console.log("- Status:", message.status);
    console.log("- From:", message.from);
    console.log("- To:", message.to);
    console.log("- Created:", message.dateCreated);
    console.log("- Direction:", message.direction);
    
    if (message.errorCode) {
      console.log("\n⚠️  Error Code:", message.errorCode);
      console.log("Error Message:", message.errorMessage);
    }

    console.log("\n✨ Test completed successfully!");
    console.log("\n💡 Next Steps:");
    console.log("1. Check your WhatsApp for the message");
    console.log("2. Check Twilio logs: https://console.twilio.com/us1/monitor/logs/messaging");
    console.log("3. If message shows 'sent' but not received, check:");
    console.log("   - Template is approved (not pending/rejected)");
    console.log("   - Recipient number is correct");
    console.log("   - WhatsApp Business number is active");
    console.log("   - No rate limits exceeded");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error:", error.message);
    
    if (error.code) {
      console.error("Error Code:", error.code);
      
      // Specific error handling
      if (error.code === 63016) {
        console.log("\n⚠️  Template Not Found or Not Approved");
        console.log("The template SID might be incorrect or pending approval.");
        console.log("\n📝 To fix:");
        console.log("1. Go to: https://console.twilio.com/us1/develop/sms/content-editor");
        console.log("2. Find 'welcome_new_tenant' template");
        console.log("3. Check status is 'Approved' (not Pending/Rejected)");
        console.log("4. Copy the exact Content SID");
        console.log("5. Update WHATSAPP_TEMPLATE_WELCOME_TENANT in .env");
      } else if (error.code === 63007) {
        console.log("\n⚠️  Template Variables Issue");
        console.log("The variables don't match the template structure.");
        console.log("Check that your template in Twilio Console uses: {{1}}, {{2}}, {{3}}, {{4}}");
      } else if (error.code === 21408) {
        console.log("\n⚠️  Authentication Failed");
        console.log("Check your Twilio credentials are correct and active.");
      } else if (error.code === 21610) {
        console.log("\n⚠️  Number Not Verified");
        console.log("Add recipient to verified numbers or upgrade to paid account.");
      } else if (error.code === 63030) {
        console.log("\n⚠️  Message Policy Violation");
        console.log("The message violates WhatsApp Business policies.");
        console.log("Check template content and variables.");
      }
    }
    
    if (error.moreInfo) {
      console.error("\n📚 More Info:", error.moreInfo);
    }

    console.log("\n🔧 General Troubleshooting:");
    console.log("1. Check Twilio logs: https://console.twilio.com/us1/monitor/logs/messaging");
    console.log("2. Verify template SID is correct");
    console.log("3. Ensure template status is 'Approved'");
    console.log("4. Check account balance and status");
    console.log("5. Verify recipient number format: +2348XXXXXXXXX");
    
    process.exit(1);
  }
}

// Run the test
testWhatsAppTemplate();

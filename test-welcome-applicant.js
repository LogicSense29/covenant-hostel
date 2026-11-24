/**
 * Test Welcome New Applicant Template
 * Tests the welcome_applicant template with variables
 * 
 * Usage: node test-welcome-applicant.js
 */

import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const welcomeApplicantSid = process.env.WHATSAPP_TEMPLATE_WELCOME_APPLICANT;

// Test recipient - change to your WhatsApp number
const TEST_NUMBER = "+2347061608636";

async function testWelcomeApplicant() {
  console.log("🧪 Testing Welcome New Applicant Template...\n");

  // Validate credentials
  if (!accountSid || !authToken || !fromNumber) {
    console.error("❌ Missing Twilio credentials in .env file");
    process.exit(1);
  }

  if (!welcomeApplicantSid) {
    console.error("❌ Missing WHATSAPP_TEMPLATE_WELCOME_APPLICANT in .env file");
    console.log("\nPlease add to .env:");
    console.log('WHATSAPP_TEMPLATE_WELCOME_APPLICANT="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"');
    console.log("\nGet SID from: https://console.twilio.com/us1/develop/sms/content-editor");
    process.exit(1);
  }

  console.log("✅ Credentials found");
  console.log(`📱 From: ${fromNumber}`);
  console.log(`📱 To: ${TEST_NUMBER}`);
  console.log(`📄 Template SID: ${welcomeApplicantSid}\n`);

  try {
    const client = twilio(accountSid, authToken);

    const formattedFrom = fromNumber.startsWith('whatsapp:') 
      ? fromNumber 
      : `whatsapp:${fromNumber}`;
    const formattedTo = TEST_NUMBER.startsWith('whatsapp:') 
      ? TEST_NUMBER 
      : `whatsapp:${TEST_NUMBER}`;

    console.log("📤 Sending Welcome New Applicant message...\n");

    // Template variables for welcome_applicant
    // {{1}} = Applicant name
    const templateVariables = {
      "1": "Adebayo Oluwaseun"
    };

    console.log("Template Variables:");
    console.log("- Name: Adebayo Oluwaseun");
    console.log();

    console.log("Expected Message:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👋 Welcome to Covenant Hostel, Adebayo Oluwaseun!");
    console.log("");
    console.log("Thank you for choosing us. Your application has been");
    console.log("received and is currently under review.");
    console.log("");
    console.log("We'll notify you via email and WhatsApp once your");
    console.log("application is processed.");
    console.log("");
    console.log("Looking forward to hosting you!");
    console.log("");
    console.log("- Covenant Hostel Management");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Send message
    const message = await client.messages.create({
      contentSid: welcomeApplicantSid,
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
    
    if (message.errorCode) {
      console.log("\n⚠️  Error Code:", message.errorCode);
      console.log("Error Message:", message.errorMessage);
    } else {
      console.log("\n✨ Check your WhatsApp now!");
      console.log("\n💡 If not received after 1-2 minutes:");
      console.log("1. Run: node check-twilio-logs.js");
      console.log("2. Check: https://console.twilio.com/us1/monitor/logs/messaging");
      console.log("3. Verify template is approved and category is UTILITY");
      console.log("4. Wait 1-2 hours if you hit rate limits earlier");
    }

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error("Error:", error.message);
    
    if (error.code) {
      console.error("Error Code:", error.code);
      
      if (error.code === 63016) {
        console.log("\n⚠️  Template Not Found or Not Approved");
        console.log("Solution:");
        console.log("1. Go to: https://console.twilio.com/us1/develop/sms/content-editor");
        console.log("2. Find 'welcome_applicant' template");
        console.log("3. Verify status is 'Approved' (not Pending/Rejected)");
        console.log("4. Copy the exact Content SID");
        console.log("5. Update WHATSAPP_TEMPLATE_WELCOME_APPLICANT in .env");
      } else if (error.code === 63007) {
        console.log("\n⚠️  Template Variables Mismatch");
        console.log("Your template must have exactly 2 variables: {{1}} and {{2}}");
      } else if (error.code === 63051) {
        console.log("\n⚠️  Account Temporarily Locked");
        console.log("Wait 1-2 hours before testing again.");
      } else if (error.code === 63049) {
        console.log("\n⚠️  Marketing Message Block");
        console.log("Template must be category UTILITY, not MARKETING.");
      }
    }
    
    if (error.moreInfo) {
      console.error("\n📚 More Info:", error.moreInfo);
    }
    
    process.exit(1);
  }
}

testWelcomeApplicant();

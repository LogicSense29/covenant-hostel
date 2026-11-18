/**
 * Check Twilio Message Logs
 * Fetches recent messages to see delivery status
 */

import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

async function checkLogs() {
  console.log("📊 Fetching Twilio Message Logs...\n");

  try {
    const client = twilio(accountSid, authToken);

    // Fetch last 10 messages
    const messages = await client.messages.list({ limit: 10 });

    console.log(`Found ${messages.length} recent messages:\n`);

    messages.forEach((msg, index) => {
      console.log(`━━━ Message ${index + 1} ━━━`);
      console.log(`SID: ${msg.sid}`);
      console.log(`Status: ${msg.status}`);
      console.log(`From: ${msg.from}`);
      console.log(`To: ${msg.to}`);
      console.log(`Direction: ${msg.direction}`);
      console.log(`Date: ${msg.dateSent || msg.dateCreated}`);
      
      if (msg.errorCode) {
        console.log(`❌ Error Code: ${msg.errorCode}`);
        console.log(`❌ Error Message: ${msg.errorMessage}`);
      }
      
      if (msg.body) {
        console.log(`Body: ${msg.body.substring(0, 100)}...`);
      }
      
      console.log();
    });

    // Check for failed messages
    const failed = messages.filter(m => m.status === 'failed' || m.status === 'undelivered');
    if (failed.length > 0) {
      console.log(`\n⚠️  Found ${failed.length} failed/undelivered messages`);
      console.log("\nFailed Message Details:");
      failed.forEach(msg => {
        console.log(`\n- SID: ${msg.sid}`);
        console.log(`  Error ${msg.errorCode}: ${msg.errorMessage}`);
        console.log(`  To: ${msg.to}`);
      });
    }

    // Check for sent but not delivered
    const sent = messages.filter(m => m.status === 'sent' || m.status === 'delivered');
    console.log(`\n✅ Successfully sent/delivered: ${sent.length}`);
    
    const queued = messages.filter(m => m.status === 'queued' || m.status === 'accepted');
    console.log(`⏳ Queued/Accepted: ${queued.length}`);

  } catch (error) {
    console.error("❌ Failed to fetch logs:", error.message);
    process.exit(1);
  }
}

checkLogs();

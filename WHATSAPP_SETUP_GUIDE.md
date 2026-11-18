# WhatsApp Integration Setup Guide
**Complete Step-by-Step Instructions**

---

## 🎯 Overview
Covenant Hostel uses Twilio to send WhatsApp messages. Twilio offers two options:
1. **WhatsApp Sandbox** (Free, for testing)
2. **WhatsApp Business API** (Paid, for production)

---

## 📋 Prerequisites
- Twilio Account (sign up at https://www.twilio.com/try-twilio)
- WhatsApp installed on your phone
- Phone number with active WhatsApp

---

## 🚀 Step 1: Get Twilio Account SID & Auth Token

1. **Login to Twilio Console**: https://console.twilio.com/
2. On the dashboard, you'll see:
   - **Account SID** (starts with "AC...")
   - **Auth Token** (click "Show" to reveal)
3. Copy both values
4. Update your `.env` file:
   ```
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="your_auth_token_here"
   ```

---

## 🧪 Step 2: Setup WhatsApp Sandbox (For Testing)

### 2a. Access Sandbox Settings
1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. OR Navigate: **Console → Messaging → Try it out → Send a WhatsApp message**

### 2b. Join the Sandbox
You'll see something like this:
```
To connect your sandbox, send:
   join <your-sandbox-code>

to WhatsApp number:
   +1 415 523 8886
```

**Action Required:**
1. Open WhatsApp on your phone
2. Start a new chat with the Twilio number (e.g., +1 415 523 8886)
3. Send the message: `join <your-sandbox-code>` (e.g., "join happy-tiger")
4. You'll receive a confirmation message

### 2c. Get Your Sandbox Number
1. After joining, go back to Twilio Console
2. Navigate: **Messaging → Try it out → Send a WhatsApp message**
3. Copy your **Sandbox number** (format: `whatsapp:+14155238886`)
4. Update your `.env` file:
   ```
   TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
   ```

---

## 🏢 Step 3: Setup WhatsApp Business API (For Production)

**Note:** This requires Facebook Business Manager approval and can take 1-3 weeks.

### 3a. Request Access
1. Go to: https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders
2. Click **"Request Access to WhatsApp"**
3. Follow the Facebook Business verification process

### 3b. Register Your Business Number
1. Provide your business phone number
2. Verify ownership via OTP
3. Submit business details for Facebook review
4. Wait for approval (usually 1-3 business days)

### 3c. Configure Message Templates
WhatsApp Business requires **pre-approved message templates** for outbound messages.

1. Go to: **Console → Messaging → WhatsApp → Templates**
2. Create templates for:
   - Rent expiry reminders
   - Payment confirmations
   - Maintenance updates
3. Submit for approval (24-48 hours)

### 3d. Update Your Number
Once approved:
```
TWILIO_WHATSAPP_NUMBER="whatsapp:+2348090791947"
```

---

## 🧪 Step 4: Test Your Setup

### Option A: Using the Test Script
```bash
node test-whatsapp.js
```

**Expected Output:**
```
🧪 Testing WhatsApp Integration...

✅ Credentials found
📱 From: whatsapp:+14155238886
📱 To: whatsapp:+2348090791947

📤 Sending test message...

✅ Message sent successfully!

Message Details:
- SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- Status: queued
- From: whatsapp:+14155238886
- To: whatsapp:+2348090791947
```

### Option B: Using Twilio Console
1. Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Enter your phone number (format: +2348090791947)
3. Type a test message
4. Click **Send**
5. Check your WhatsApp

---

## ❌ Common Issues & Solutions

### Issue 1: "Message not sent" / No error shown
**Cause:** Recipient hasn't joined the sandbox
**Solution:** 
- For sandbox: Recipient MUST join by sending `join <code>` first
- For production: No need to join, but templates must be approved

### Issue 2: Error 63007 - "Sandbox number not authorized"
**Cause:** Your phone number isn't registered in the sandbox
**Solution:**
1. Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. Scroll to **"Sandbox Participants"**
3. Add your number: +2348090791947

### Issue 3: Error 21408 - "Permission to send"
**Cause:** Account or number not verified
**Solution:**
1. Verify your Twilio account (add payment method)
2. Verify your phone number in Twilio Console

### Issue 4: "Cannot send to unverified number"
**Cause:** Using trial account
**Solution:**
- Add the recipient number to **Verified Caller IDs** in Twilio Console
- OR upgrade to a paid account

### Issue 5: Error 21610 - "Unverified number"
**Cause:** Trial account restriction
**Solution:**
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click **"Add a new Caller ID"**
3. Verify your number via OTP

---

## 🔐 Security Best Practices

1. **Never commit .env file** (already in .gitignore)
2. **Rotate Auth Token** if exposed
3. **Use environment variables** in production (Vercel, Railway, etc.)
4. **Enable IP whitelisting** in Twilio Console
5. **Monitor usage** to detect abuse

---

## 📊 Testing Checklist

- [ ] Twilio credentials added to `.env`
- [ ] Sandbox joined on your phone
- [ ] Test recipient joined sandbox
- [ ] Test script runs without errors
- [ ] Test message received on WhatsApp
- [ ] Check Twilio Console logs for delivery status

---

## 🎯 Current Configuration

Your `.env` file has:
```
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1xxxxxxxxxx"
```

**Next Steps:**
1. Verify these credentials are active in Twilio Console
2. Check if +19067676366 is a Sandbox or Business number
3. Join the sandbox if it's a test number
4. Add +2348090791947 to sandbox participants

---

## 🆘 Still Not Working?

1. **Check Twilio Logs:**
   - Go to: https://console.twilio.com/us1/monitor/logs/messaging
   - Filter by "Last 24 hours"
   - Look for failed messages and error codes

2. **Verify Sandbox Status:**
   - Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
   - Check "Sandbox Participants" list
   - Ensure your number is active

3. **Test with Twilio's Built-in Tester:**
   - Use the "Try it out" feature in Console
   - This confirms if the issue is with Twilio or your code

4. **Contact Twilio Support:**
   - https://support.twilio.com/
   - Include your Account SID and error logs

---

## 📚 Resources

- Twilio WhatsApp Quickstart: https://www.twilio.com/docs/whatsapp/quickstart
- WhatsApp Sandbox Guide: https://www.twilio.com/docs/whatsapp/sandbox
- Error Code Reference: https://www.twilio.com/docs/api/errors
- Twilio Console: https://console.twilio.com/

---

**Last Updated:** Now
**Support:** weeynov@gmail.com

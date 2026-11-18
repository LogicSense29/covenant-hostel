# Fix WhatsApp Delivery Errors

## 🔍 Current Issues

**Error 63051:** WhatsApp Sender or Account is Locked  
**Error 63049:** Meta chose not to deliver this WhatsApp marketing message

**Good News:** Your Twilio dashboard shows:
- ✅ Status: Online
- ✅ Quality Rating: High
- ✅ Throughput: 80 MPS

This means the issues are **template-related**, not account-level.

---

## 🎯 Root Cause: Template Category

WhatsApp has strict rules:
- **UTILITY** templates = Transactional messages (order updates, reminders, confirmations)
- **MARKETING** templates = Promotional messages (requires opt-in, time restrictions)

If your welcome template is marked as **MARKETING**, WhatsApp will block it unless:
1. Recipient opted-in to marketing
2. Message sent during allowed hours (9 AM - 9 PM local time)
3. Recipient messaged you first within 24 hours

---

## 🔧 Solution: Fix Template Category

### Step 1: Check Current Template Category

1. Go to: https://business.facebook.com/wa/manage/message-templates/
2. Or: https://console.twilio.com/us1/develop/sms/content-editor
3. Find your welcome template
4. Check the **Category** field

### Step 2: If Category is MARKETING → Change to UTILITY

**Option A: Edit Template (if allowed)**
1. Click "Edit" on the template
2. Change **Category** from "MARKETING" to "UTILITY"
3. Submit for re-approval
4. Wait 15-60 minutes

**Option B: Create New Template (recommended)**
1. Click "Create Template"
2. **Name:** `welcome_tenant_utility`
3. **Category:** ⚠️ **UTILITY** (critical!)
4. **Language:** English
5. **Body:** Keep your current message text
6. Submit for approval
7. Once approved, update `.env`:
   ```
   WHATSAPP_TEMPLATE_WELCOME_TENANT="HXnewTemplateIdHere"
   ```

---

## 📋 Template Content Guidelines for UTILITY Category

To ensure approval as UTILITY:

✅ **Good (Transactional):**
- "Welcome to Covenant Hostel! Your registration is complete."
- "Your booking for Room 24 is confirmed."
- "Thank you for joining us."

❌ **Bad (Promotional):**
- "Get 20% off your first month!"
- "Limited time offer - book now!"
- "Refer a friend and win prizes!"

---

## 🚀 Immediate Fix (While Waiting for Template)

Since your account is healthy, the issue is just the template. Here's what to do:

### Option 1: Use Twilio's Pre-Approved Templates
Twilio has built-in approved templates you can use immediately:

1. Go to: https://console.twilio.com/us1/develop/sms/content-editor
2. Look for **"Twilio Approved Templates"** section
3. Find a generic confirmation template
4. Use that SID temporarily

### Option 2: Wait for Your Template Category Fix
- Edit your template to UTILITY category
- Or create new template as UTILITY
- Get approval (15-60 mins)
- Update .env with new SID
- Test again

---

## 🔍 Error 63051 - Temporary Lock

This error usually means:
- **Too many failed attempts** in short time
- **Solution:** Wait 1-2 hours before testing again
- Don't send more test messages now (makes it worse)

**After fixing template category, wait 1-2 hours, then test again.**

---

## ✅ Checklist

- [ ] Check template category in Meta Business Manager
- [ ] If MARKETING, change to UTILITY or create new template
- [ ] Wait for approval (15-60 mins)
- [ ] Update WHATSAPP_TEMPLATE_WELCOME_TENANT in .env
- [ ] Wait 1-2 hours for rate limit to clear
- [ ] Test with: `node test-welcome-simple.js`

---

## 📞 If Still Not Working

1. **Contact Twilio Support:**
   - https://support.twilio.com/
   - Mention Error 63051 and 63049
   - Ask to verify template category
   - Request account status review

2. **Check Meta Business Manager:**
   - https://business.facebook.com/
   - Look for any warnings or notifications
   - Verify business verification status

3. **Alternative: Use SMS Instead**
   - While fixing WhatsApp, use SMS for urgent notifications
   - Already configured in your system via Twilio

---

**Summary:** Your integration is correct, account is healthy. Just need to fix template category from MARKETING to UTILITY, then wait 1-2 hours for rate limits to clear.

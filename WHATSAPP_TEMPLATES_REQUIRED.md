# WhatsApp Message Templates for Covenant Hostel
**Required for WhatsApp Business API**

---

## 📋 Overview
WhatsApp Business API requires **pre-approved templates** for all outbound messages. Each template must be submitted to Facebook/Meta for approval (usually 15-60 minutes).

**Where to Submit:** https://console.twilio.com/us1/develop/sms/content-editor

---

## 🏠 Required Templates for Covenant Hostel

### 1. **Rent Expiry Reminder**
**Template Name:** `rent_expiry_reminder`  
**Category:** Utility  
**Language:** English  

**Body:**
```
Hi {{1}},

Your rent for Room {{2}} expires in {{3}} days ({{4}}).

Please renew your payment before expiry to avoid service interruption.

- Covenant Hostel Management
```

**Variables:**
1. Tenant name
2. Room number
3. Days left
4. Expiry date

**Used in:** `src/app/api/cron/rent-reminders/route.js`

---

### 2. **Installment Payment Due**
**Template Name:** `installment_payment_due`  
**Category:** Utility  
**Language:** English  

**Body:**
```
Hi {{1}},

Your installment payment for Room {{2}} is due on {{3}}.

Amount: ₦{{4}}
Installment: {{5}} of {{6}}

Please login to make your payment.

- Covenant Hostel Management
```

**Variables:**
1. Tenant name
2. Room number
3. Due date
4. Amount
5. Current installment number
6. Total installments

**Used in:** `src/app/api/cron/rent-reminders/route.js`

---

### 3. **Recurring Charge Due**
**Template Name:** `recurring_charge_due`  
**Category:** Utility  
**Language:** English  

**Body:**
```
Hi {{1}},

You have a recurring charge due for Room {{2}}.

Charge: {{3}}
Amount: ₦{{4}}
Due: {{5}}

Please login to settle this charge.

- Covenant Hostel Management
```

**Variables:**
1. Tenant name
2. Room number
3. Charge description
4. Amount
5. Due date

**Used in:** `src/app/api/cron/rent-reminders/route.js`

---

### 4. **Payment Overdue Alert**
**Template Name:** `payment_overdue`  
**Category:** Utility  
**Language:** English  

**Body:**
```
⚠️ URGENT: Hi {{1}},

Your payment for Room {{2}} is now OVERDUE.

Amount: ₦{{3}}
Due Date: {{4}}

Please make payment immediately to avoid late fees or service interruption.

- Covenant Hostel Management
```

**Variables:**
1. Tenant name
2. Room number
3. Amount
4. Original due date

**Used in:** `src/app/api/cron/rent-reminders/route.js`

---

### 5. **Rent Expired Notification**
**Template Name:** `rent_expired`  
**Category:** Utility  
**Language:** English  

**Body:**
```
Hi {{1}},

Your rent for Room {{2}} has expired as of {{3}}.

Please renew immediately to continue your stay. Portal access has been restricted until payment is made.

- Covenant Hostel Management
```

**Variables:**
1. Tenant name
2. Room number
3. Expiry date

**Used in:** `src/app/api/cron/rent-reminders/route.js`

---

### 6. **Maintenance Assignment (Provider)**
**Template Name:** `maintenance_assigned_provider`  
**Category:** Utility  
**Language:** English  

**Body:**
```
Hi {{1}},

You have been assigned a maintenance task for Room {{2}}.

Issue: {{3}}
Priority: {{4}}

Please login to view details and update status.

- Covenant Hostel Management
```

**Variables:**
1. Provider name
2. Room number
3. Issue title
4. Priority level

**Used in:** `src/app/api/maintenance/tickets/[id]/assign/route.js`

---

### 7. **Registration Reminder**
**Template Name:** `registration_incomplete`  
**Category:** Utility  
**Language:** English  

**Body:**
```
👋 Hi {{1}},

You started an application for Covenant Hostel but didn't finish.

Pick up right where you left off: {{2}}

- Covenant Hostel Management
```

**Variables:**
1. Applicant name
2. Resume URL

**Used in:** `src/app/api/cron/registration-reminders/route.js`

---

### 8. **Welcome New Tenant**
**Template Name:** `welcome_new_tenant`  
**Category:** Utility  
**Language:** English  

**Body:**
```
🎉 Welcome to Covenant Hostel, {{1}}!

Your registration is complete for Room {{2}}.

Move-in Date: {{3}}
Rent Expiry: {{4}}

Login to access your dashboard, pay bills, and request maintenance.

Portal: https://covenant-hostel.vercel.app

- Covenant Hostel Management
```

**Variables:**
1. Tenant name
2. Room number
3. Move-in date
4. Rent expiry date

**Used in:** When tenant is approved and room is assigned

---

### 9. **Welcome New Applicant**
**Template Name:** `welcome_applicant`  
**Category:** Utility  
**Language:** English  

**Body:**
```
👋 Hi {{1}},

Thank you for applying to Covenant Hostel!

Your application has been received and is under review. We'll notify you once it's processed.

Application ID: {{2}}

- Covenant Hostel Management
```

**Variables:**
1. Applicant name
2. Application ID

**Used in:** Right after registration form submission

---

### 10. **Application Approved**
**Template Name:** `application_approved`  
**Category:** Utility  
**Language:** English  

**Body:**
```
✅ Great news, {{1}}!

Your application for Covenant Hostel has been APPROVED!

Next Steps:
1. Login to complete payment
2. Schedule your move-in date
3. Review hostel guidelines

Portal: https://covenant-hostel.vercel.app

- Covenant Hostel Management
```

**Variables:**
1. Applicant name

**Used in:** When landlord approves an application

---

### 11. **Inspection Booking Confirmed**
**Template Name:** `inspection_confirmed`  
**Category:** Utility  
**Language:** English  

**Body:**
```
✅ Inspection Booked!

Hi {{1}}, your room inspection has been confirmed.

Room: {{2}}
Block: {{3}}
Date: {{4}}
Time: {{5}}

{{6}}

Please arrive on time. If you need to reschedule, contact us immediately.

- Covenant Hostel Management
```

**Variables:**
1. Applicant name
2. Room number
3. Block name
4. Inspection date
5. Inspection time
6. Fee message (e.g., "Fee: ₦5,000 paid" or "Free inspection")

**Used in:** After inspection booking is confirmed

---

### 12. **Inspection Reminder (24h before)**
**Template Name:** `inspection_reminder`  
**Category:** Utility  
**Language:** English  

**Body:**
```
⏰ Inspection Tomorrow!

Hi {{1}}, this is a reminder about your room inspection.

Room: {{2}}
Date: {{3}}
Time: {{4}}
Location: {{5}}

Please bring a valid ID and arrive on time.

- Covenant Hostel Management
```

**Variables:**
1. Applicant name
2. Room number
3. Inspection date
4. Inspection time
5. Block address

**Used in:** 24 hours before scheduled inspection

---

### 13. **Payment Confirmation**
**Template Name:** `payment_confirmed`  
**Category:** Utility  
**Language:** English  

**Body:**
```
✅ Payment Received!

Hi {{1}}, your payment has been confirmed.

Amount: ₦{{2}}
Type: {{3}}
Date: {{4}}

Your rent is now active until {{5}}.

Thank you for your payment!

- Covenant Hostel Management
```

**Variables:**
1. Tenant name
2. Amount paid
3. Payment type (Full/Installment/Utility)
4. Payment date
5. New expiry date

**Used in:** After successful payment verification

---

### 14. **General Test Message** (Optional)
**Template Name:** `general_notification`  
**Category:** Utility  
**Language:** English  

**Body:**
```
Hi {{1}},

{{2}}

- Covenant Hostel Management
```

**Variables:**
1. Recipient name
2. Custom message body

**Used in:** Testing and ad-hoc notifications

---

## 📝 How to Submit Templates

### Step 1: Go to Content Editor
https://console.twilio.com/us1/develop/sms/content-editor

### Step 2: Create New Template
1. Click **"Create Template"**
2. Select **"WhatsApp"** as channel
3. Choose **"Twilio Approved"** or **"Custom"**

### Step 3: Fill Template Details
- **Template Name:** Use exact names from above (e.g., `rent_expiry_reminder`)
- **Category:** Select "Utility" (for transactional messages)
- **Language:** English
- **Body:** Copy the body text exactly
- **Variables:** Use `{{1}}`, `{{2}}`, etc. for dynamic content

### Step 4: Submit for Approval
1. Click **"Submit for Approval"**
2. Facebook/Meta will review (usually 15-60 minutes)
3. Check status: Approved, Pending, or Rejected

### Step 5: Use Approved Templates
Once approved, you can send messages using the template. Example:

```javascript
const message = await client.messages.create({
  contentSid: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Template SID
  from: 'whatsapp:+19067676366',
  to: 'whatsapp:+2348090791947',
  contentVariables: JSON.stringify({
    "1": "John Doe",
    "2": "Room 24",
    "3": "7",
    "4": "Nov 2, 2026"
  })
});
```

---

## 🔄 Update Code to Use Templates

After templates are approved, you need to update the code to use `contentSid` instead of raw `body` text.

**Current code (won't work with Business API):**
```javascript
await sendWhatsAppMessage({
  to: tenant.phone,
  body: `Hi ${name}, your rent expires in ${days} days`
});
```

**Updated code (required for Business API):**
```javascript
await sendWhatsAppMessage({
  to: tenant.phone,
  templateSid: 'HXxxxxxxxxxxxxx',
  variables: {
    "1": name,
    "2": roomNumber,
    "3": days.toString(),
    "4": expiryDate
  }
});
```

I can update the `src/lib/whatsapp.js` file to support both raw messages (for testing) and templates (for production) once your templates are approved.

---

## ⚠️ Important Notes

1. **Template Rejection Reasons:**
   - Too promotional/marketing focused
   - Contains URLs (use Button components instead)
   - Spelling/grammar errors
   - Violates WhatsApp policies

2. **Template Variables:**
   - Must use `{{1}}`, `{{2}}`, etc. (sequential numbers)
   - Cannot use `{{name}}` or `{{room}}` (named variables not supported)
   - Keep variable count minimal (max 10 recommended)

3. **Template Categories:**
   - **Utility:** Transactional messages (rent reminders, payments)
   - **Marketing:** Promotional content (requires opt-in)
   - **Authentication:** OTP/verification codes

4. **Approval Time:**
   - Usually 15-60 minutes
   - Can take up to 24 hours
   - Rejected templates can be resubmitted with fixes

---

## 🎯 Priority Order

Submit templates in this order (highest priority first):

### **Immediate Priority (Submit First):**
1. ✅ `rent_expiry_reminder` (most critical)
2. ✅ `installment_payment_due` (high usage)
3. ✅ `payment_overdue` (urgent)
4. ✅ `payment_confirmed` (positive UX)

### **High Priority:**
5. ✅ `welcome_new_tenant` (great first impression)
6. ✅ `inspection_confirmed` (positive UX)
7. ✅ `rent_expired` (urgent)
8. ✅ `recurring_charge_due` (medium usage)

### **Medium Priority:**
9. ✅ `application_approved` (good UX)
10. ✅ `inspection_reminder` (helpful UX)
11. ✅ `maintenance_assigned_provider` (for providers)
12. ✅ `welcome_applicant` (nice to have)

### **Low Priority:**
13. ✅ `registration_incomplete` (low usage)
14. ⚪ `general_notification` (optional/backup)

---

## 📞 Need Help?

If templates get rejected or you need custom templates:
1. Check rejection reason in Twilio Console
2. Review WhatsApp Business Policy: https://www.whatsapp.com/legal/business-policy
3. Contact Twilio Support: https://support.twilio.com/
4. Test templates before submitting: Use the preview feature in Console

---

**Next Steps:**
1. ✅ Submit all 14 templates above (prioritize top 8 first)
2. ⏳ Wait for approval (check email for notifications)
3. 🔄 Update `src/lib/whatsapp.js` to use templates
4. ✅ Test with approved templates
5. 🚀 Enable WhatsApp reminders in settings

---

**Created:** Now  
**Status:** Templates need to be submitted  
**Total Templates:** 14 (8 critical + 6 enhanced UX)  
**Action Required:** Submit templates to Twilio Console

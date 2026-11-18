# WhatsApp Setup - Next Steps

## ✅ What's Done
- [x] Templates submitted and approved
- [x] Code updated to support templates
- [x] Helper functions created for each template

---

## 🎯 What You Need To Do Now

### Step 1: Get Template SIDs from Twilio (5 minutes)

1. Go to: https://console.twilio.com/us1/develop/sms/content-editor
2. You'll see all your approved templates
3. Click on each template to open it
4. Copy the **Content SID** (starts with `HX...`)
5. Write them down or keep the tab open

---

### Step 2: Add Template SIDs to `.env` File (5 minutes)

Open your `.env` file and add these lines at the bottom:

```bash
# WhatsApp Template SIDs (get from Twilio Console → Content Editor)
WHATSAPP_TEMPLATE_RENT_EXPIRY="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_INSTALLMENT_DUE="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_PAYMENT_OVERDUE="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_RENT_EXPIRED="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_RECURRING_CHARGE="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_WELCOME_TENANT="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_WELCOME_APPLICANT="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_APP_APPROVED="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_INSPECTION_CONFIRMED="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_INSPECTION_REMINDER="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_MAINTENANCE_ASSIGNED="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_TEMPLATE_GENERAL="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Replace each `HXxxx...` with the actual Content SID from Twilio Console.**

---

### Step 3: Match Template Names to SIDs

Here's the mapping to help you:

| Template Name in Twilio | .env Variable |
|------------------------|---------------|
| `rent_expiry_reminder` | `WHATSAPP_TEMPLATE_RENT_EXPIRY` |
| `installment_payment_due` | `WHATSAPP_TEMPLATE_INSTALLMENT_DUE` |
| `payment_overdue` | `WHATSAPP_TEMPLATE_PAYMENT_OVERDUE` |
| `rent_expired` | `WHATSAPP_TEMPLATE_RENT_EXPIRED` |
| `recurring_charge_due` | `WHATSAPP_TEMPLATE_RECURRING_CHARGE` |
| `payment_confirmed` | `WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED` |
| `welcome_new_tenant` | `WHATSAPP_TEMPLATE_WELCOME_TENANT` |
| `welcome_applicant` | `WHATSAPP_TEMPLATE_WELCOME_APPLICANT` |
| `application_approved` | `WHATSAPP_TEMPLATE_APP_APPROVED` |
| `inspection_confirmed` | `WHATSAPP_TEMPLATE_INSPECTION_CONFIRMED` |
| `inspection_reminder` | `WHATSAPP_TEMPLATE_INSPECTION_REMINDER` |
| `maintenance_assigned_provider` | `WHATSAPP_TEMPLATE_MAINTENANCE_ASSIGNED` |
| `registration_incomplete` | `WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE` |
| `general_notification` | `WHATSAPP_TEMPLATE_GENERAL` |

---

### Step 4: Test With Updated Script (2 minutes)

I'll create a new test script that uses templates. After you add the SIDs to `.env`:

```bash
node test-whatsapp-template.js
```

---

### Step 5: Update Production .env (Vercel/Railway)

Don't forget to add these same environment variables to your production deployment:

**For Vercel:**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add each `WHATSAPP_TEMPLATE_*` variable
3. Redeploy

**For Railway:**
1. Go to your project → Variables
2. Add each `WHATSAPP_TEMPLATE_*` variable
3. Redeploy

---

## 🧪 Testing Checklist

After adding SIDs:
- [ ] Local `.env` updated with all 14 template SIDs
- [ ] Test script runs without errors
- [ ] Test message received on WhatsApp
- [ ] Production environment variables updated
- [ ] Production deployment redeployed
- [ ] Enabled WhatsApp reminders in Settings page

---

## 📝 Notes

- **Missing SID?** If a template SID is `null`, the system will skip WhatsApp and only send email
- **Template rejected?** Fix and resubmit, then update the SID
- **Want to test one?** Use `test-whatsapp-template.js` script

---

**Once you've added the SIDs to `.env`, let me know and I'll update the cron jobs to use the templates!**

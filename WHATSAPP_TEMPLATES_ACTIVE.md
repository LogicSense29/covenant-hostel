# Active WhatsApp Templates

This document lists the WhatsApp templates that are **CURRENTLY ACTIVE** in the system.

**Last Updated:** December 20, 2024

---

## ✅ **Active Templates (12)**

These templates are configured and ready to use:

| # | Template Name | Environment Variable | Status | Use Case |
|---|---------------|---------------------|--------|----------|
| 1 | **welcome_new_tenant** | `WHATSAPP_TEMPLATE_WELCOME_TENANT` | ✅ Active | When tenant is activated |
| 2 | **welcome_applicant** | `WHATSAPP_TEMPLATE_WELCOME_APPLICANT` | ✅ Active | After registration submission |
| 3 | **rent_expiry_reminder** | `WHATSAPP_TEMPLATE_RENT_EXPIRY` | ✅ Active | 7 days before rent expires |
| 4 | **installment_payment_due** | `WHATSAPP_TEMPLATE_INSTALLMENT_DUE` | ✅ Active | Installment payment reminder |
| 5 | **payment_overdue** | `WHATSAPP_TEMPLATE_PAYMENT_OVERDUE` | ✅ Active | Payment is overdue |
| 6 | **rent_expired** | `WHATSAPP_TEMPLATE_RENT_EXPIRED` | ✅ Active | Rent has expired |
| 7 | **recurring_charge_due** | `WHATSAPP_TEMPLATE_RECURRING_CHARGE` | ✅ Active | Recurring charge reminder |
| 8 | **application_approved** | `WHATSAPP_TEMPLATE_APP_APPROVED` | ✅ Active | Application approved |
| 9 | **inspection_confirmed** | `WHATSAPP_TEMPLATE_INSPECTION_CONFIRMED` | ✅ Active | Inspection booking confirmed |
| 10 | **maintenance_assigned** | `WHATSAPP_TEMPLATE_MAINTENANCE_ASSIGNED` | ✅ Active | Maintenance ticket assigned |
| 11 | **registration_incomplete** | `WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE` | ✅ Active | Resume registration reminder |
| 12 | **general_announcement** | `WHATSAPP_TEMPLATE_GENERAL` | ✅ Active | General announcements |

---

## ⏸️ **Disabled Templates (2)**

These templates are commented out and **NOT CURRENTLY USED**:

| # | Template Name | Reason | Date Disabled |
|---|---------------|--------|---------------|
| 1 | **payment_confirmation** | Not using for now | Dec 20, 2024 |
| 2 | **inspection_reminder** | Not using for now | Dec 20, 2024 |

**Location in Code:**
- `src/lib/whatsapp-templates.js` - Functions commented out
- `.env` - Environment variables commented out

---

## 📊 **Template Summary**

**Total Templates Defined:** 14  
**Active Templates:** 12  
**Disabled Templates:** 2

---

## 🔧 **Configuration**

### **Active Template SIDs (.env):**
```env
WHATSAPP_TEMPLATE_WELCOME_TENANT="HXb8ada74d330b3ae925d9cedfac2ba95f"
WHATSAPP_TEMPLATE_WELCOME_APPLICANT="HX82b88ca7ce4a128d135857253d004c84"
WHATSAPP_TEMPLATE_RENT_EXPIRY="HX02af0d3c042fa07b7375f05ca09b1941"
WHATSAPP_TEMPLATE_INSTALLMENT_DUE="HXbf4c2342448b688d99ae20faff46bce7"
WHATSAPP_TEMPLATE_PAYMENT_OVERDUE="HXef96a0213c1165ba86e4a84900416c27"
WHATSAPP_TEMPLATE_RENT_EXPIRED="HXe6cec4cc2b95afa6e656fb1b64cd9bca"
WHATSAPP_TEMPLATE_RECURRING_CHARGE="HX6e9541c360e77235183b9afd2d2488ef"
WHATSAPP_TEMPLATE_APP_APPROVED="HX04a49785bb48e176c8ab38c14a167c6c"
WHATSAPP_TEMPLATE_INSPECTION_CONFIRMED="HX18455f0f646d013b0c7fa5cf4d56d839"
WHATSAPP_TEMPLATE_MAINTENANCE_ASSIGNED="HXc52ab9ca3c04fb8d2795751c428d0b4a"
WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE="HXe28a1e9b6f58ffe0dbce0e35f554d209"
WHATSAPP_TEMPLATE_GENERAL="HX3ed6aff76a8860f57919ea6ecea0349f"
```

### **Disabled (Commented Out):**
```env
# WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" # NOT USING FOR NOW
# WHATSAPP_TEMPLATE_INSPECTION_REMINDER="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" # NOT USING FOR NOW
```

---

## 📝 **Usage Examples**

### **Active Templates:**

```javascript
import { 
  buildWelcomeTenant,
  buildWelcomeApplicant,
  buildRentExpiryReminder,
  buildApplicationApproved,
  buildInspectionConfirmed,
  buildMaintenanceAssigned,
  buildRegistrationIncomplete
} from '@/lib/whatsapp-templates';

// Welcome new tenant
await sendWhatsAppMessage({
  to: "+2348123456789",
  ...buildWelcomeTenant({ name: "John Doe", roomNumber: "7" })
});

// Rent expiry reminder
await sendWhatsAppMessage({
  to: "+2348123456789",
  ...buildRentExpiryReminder({ 
    name: "John Doe", 
    roomNumber: "7", 
    daysLeft: 7, 
    expiryDate: "Dec 27, 2024" 
  })
});
```

### **Disabled Templates (Will Not Work):**

```javascript
// ❌ COMMENTED OUT - Will throw error if used
// import { buildPaymentConfirmation } from '@/lib/whatsapp-templates';
// import { buildInspectionReminder } from '@/lib/whatsapp-templates';
```

---

## 🔄 **To Re-enable Disabled Templates:**

1. **Uncomment in `src/lib/whatsapp-templates.js`:**
   - Uncomment the TEMPLATE_SIDS entry
   - Uncomment the helper function

2. **Uncomment in `.env`:**
   - Remove the `#` from the environment variable
   - Add the actual Content SID if available

3. **Restart the server:**
   - Changes to `.env` require server restart

---

## 📚 **Related Documentation**

- `WHATSAPP_TEMPLATES_REQUIRED.md` - Full template specifications
- `WHATSAPP_ALL_TEMPLATES_SAMPLES.md` - Sample outputs
- `WHATSAPP_ENV_VARIABLES.md` - Environment variable mapping
- `WHATSAPP_PRODUCTION_READINESS.md` - Production deployment guide

---

**Note:** Only create/submit templates in Twilio Console for the **12 active templates**. The 2 disabled templates should not be submitted for now.

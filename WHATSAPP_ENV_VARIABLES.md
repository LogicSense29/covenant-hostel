# WhatsApp Template Environment Variables

This file maps all WhatsApp templates to their corresponding environment variable names **actually used in the code**.

## Environment Variable Mapping (From Code)

| # | Template Name | Code Reference | Environment Variable | Status |
|---|---------------|----------------|---------------------|--------|
| 1 | welcome_new_tenant | `WELCOME_NEW_TENANT` | `WHATSAPP_TEMPLATE_WELCOME_TENANT` | ✅ Active |
| 2 | welcome_applicant | `WELCOME_APPLICANT` | `WHATSAPP_TEMPLATE_WELCOME_APPLICANT` | ✅ Active |
| 3 | rent_expiry_reminder | `RENT_EXPIRY_REMINDER` | `WHATSAPP_TEMPLATE_RENT_EXPIRY` | ⏳ Pending SID |
| 4 | installment_payment_due | `INSTALLMENT_PAYMENT_DUE` | `WHATSAPP_TEMPLATE_INSTALLMENT_DUE` | ⏳ Pending SID |
| 5 | payment_overdue | `PAYMENT_OVERDUE` | `WHATSAPP_TEMPLATE_PAYMENT_OVERDUE` | ⏳ Pending SID |
| 6 | rent_expired | `RENT_EXPIRED` | `WHATSAPP_TEMPLATE_RENT_EXPIRED` | ⏳ Pending SID |
| 7 | recurring_charge_due | `RECURRING_CHARGE_DUE` | `WHATSAPP_TEMPLATE_RECURRING_CHARGE` | ⏳ Pending SID |
| 8 | payment_confirmed | `PAYMENT_CONFIRMED` | `WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED` | ⏳ Pending SID |
| 9 | application_approved | `APPLICATION_APPROVED` | `WHATSAPP_TEMPLATE_APP_APPROVED` | ⏳ Pending SID |
| 10 | inspection_confirmed | `INSPECTION_CONFIRMED` | `WHATSAPP_TEMPLATE_INSPECTION_CONFIRMED` | ⏳ Pending SID |
| 11 | inspection_reminder | `INSPECTION_REMINDER` | `WHATSAPP_TEMPLATE_INSPECTION_REMINDER` | ⏳ Pending SID |
| 12 | maintenance_assigned_provider | `MAINTENANCE_ASSIGNED` | `WHATSAPP_TEMPLATE_MAINTENANCE_ASSIGNED` | ⏳ Pending SID |
| 13 | registration_incomplete | `REGISTRATION_INCOMPLETE` | `WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE` | ⏳ Pending SID |
| 14 | general_notification | `GENERAL_NOTIFICATION` | `WHATSAPP_TEMPLATE_GENERAL` | ⏳ Pending SID |

---

## Code Reference (src/lib/whatsapp-templates.js)

```javascript
export const TEMPLATE_SIDS = {
  // Rent & Payment Templates
  RENT_EXPIRY_REMINDER: process.env.WHATSAPP_TEMPLATE_RENT_EXPIRY || null,
  INSTALLMENT_PAYMENT_DUE: process.env.WHATSAPP_TEMPLATE_INSTALLMENT_DUE || null,
  PAYMENT_OVERDUE: process.env.WHATSAPP_TEMPLATE_PAYMENT_OVERDUE || null,
  RENT_EXPIRED: process.env.WHATSAPP_TEMPLATE_RENT_EXPIRED || null,
  RECURRING_CHARGE_DUE: process.env.WHATSAPP_TEMPLATE_RECURRING_CHARGE || null,
  PAYMENT_CONFIRMED: process.env.WHATSAPP_TEMPLATE_PAYMENT_CONFIRMED || null,
  
  // Welcome & Onboarding Templates
  WELCOME_NEW_TENANT: process.env.WHATSAPP_TEMPLATE_WELCOME_TENANT || null,
  WELCOME_APPLICANT: process.env.WHATSAPP_TEMPLATE_WELCOME_APPLICANT || null,
  APPLICATION_APPROVED: process.env.WHATSAPP_TEMPLATE_APP_APPROVED || null,
  
  // Inspection Templates
  INSPECTION_CONFIRMED: process.env.WHATSAPP_TEMPLATE_INSPECTION_CONFIRMED || null,
  INSPECTION_REMINDER: process.env.WHATSAPP_TEMPLATE_INSPECTION_REMINDER || null,
  
  // Maintenance Templates
  MAINTENANCE_ASSIGNED: process.env.WHATSAPP_TEMPLATE_MAINTENANCE_ASSIGNED || null,
  
  // Other Templates
  REGISTRATION_INCOMPLETE: process.env.WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE || null,
  GENERAL_NOTIFICATION: process.env.WHATSAPP_TEMPLATE_GENERAL || null,
};
```

---

## How to Get Template SIDs

1. **Create templates in Twilio Console:**
   - Go to: https://console.twilio.com/us1/develop/sms/content-editor
   - Create each template with exact name and body from `WHATSAPP_TEMPLATES_REQUIRED.md`

2. **Wait for approval:**
   - Twilio reviews templates (typically 15-60 minutes)
   - Status will change from "Pending" ��� "Approved"

3. **Copy Content SID:**
   - Click on approved template
   - Copy the Content SID (starts with `HX`)
   - Format: `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (34 characters)

4. **Update .env file:**
   - Replace placeholder `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with actual SID
   - Example:
     ```
     WHATSAPP_TEMPLATE_RENT_EXPIRED="HX585496dca14bc7f6311618a72c988845"
     ```

5. **Restart server:**
   - Changes to `.env` require server restart to take effect

---

## Usage in Code

### Send a template using helper functions:
```javascript
import { buildWelcomeTenant } from '@/lib/whatsapp-templates';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// Build the template payload
const payload = buildWelcomeTenant({
  name: "John Doe",
  roomNumber: "7"
});

// Send via WhatsApp
await sendWhatsAppMessage({
  to: "+2348123456789",
  ...payload
});
```

---

## Template Categories

### **Button Templates (2):**
- `welcome_new_tenant` - Has "Open Dashboard" button
- `registration_incomplete` - Has "Continue Application" button with dynamic URL

### **Text Templates (12):**
All other templates are text-only (no buttons)

---

## Notes

- **Env variable names** are defined in `src/lib/whatsapp-templates.js` (not arbitrary!)
- **Template names** in Twilio Console should match the template names in documentation
- **Content SIDs** are unique per template and remain the same after approval
- **Variables** use sequential numbering: `{{1}}`, `{{2}}`, `{{3}}`, etc.
- See `WHATSAPP_TEMPLATES_REQUIRED.md` for complete template details

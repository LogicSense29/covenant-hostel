# WhatsApp Template SIDs
**Fill in these SIDs from Twilio Console after templates are approved**

To find your Template SIDs:
1. Go to: https://console.twilio.com/us1/develop/sms/content-editor
2. Click on each approved template
3. Copy the "Content SID" (starts with HX...)
4. Paste below

---

## Template SIDs (Update These)

```javascript
// Rent & Payment Templates
export const TEMPLATE_SIDS = {
  RENT_EXPIRY_REMINDER: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  INSTALLMENT_PAYMENT_DUE: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  PAYMENT_OVERDUE: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  RENT_EXPIRED: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  RECURRING_CHARGE_DUE: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  PAYMENT_CONFIRMED: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // Welcome & Onboarding Templates
  WELCOME_NEW_TENANT: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  WELCOME_APPLICANT: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  APPLICATION_APPROVED: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // Inspection Templates
  INSPECTION_CONFIRMED: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  INSPECTION_REMINDER: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // Maintenance Templates
  MAINTENANCE_ASSIGNED_PROVIDER: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // Other Templates
  REGISTRATION_INCOMPLETE: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  GENERAL_NOTIFICATION: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
};
```

---

## Quick Fill Instructions

1. Open Twilio Console: https://console.twilio.com/us1/develop/sms/content-editor
2. For each template name above:
   - Find it in the list
   - Click to open
   - Copy the **Content SID** (HX...)
   - Replace the corresponding `HXxxx...` above
3. Save this file
4. Copy the entire `TEMPLATE_SIDS` object to use in code

---

**Status:** Waiting for SIDs to be filled in

# WhatsApp Template Samples for Submission
**Copy these exactly into Meta/Twilio Console**

---

## 1. Welcome New Applicant

### Template Details:
- **Name:** `welcome_applicant`
- **Category:** **UTILITY** ⚠️
- **Language:** English

### Header (Optional):
None

### Body:
```
👋 Hi {{1}},

Thank you for applying to Covenant Hostel!

Your application has been received and is under review. We'll notify you once it's processed.

Application ID: {{2}}

- Covenant Hostel Management
```

### Footer (Optional):
None

### Buttons (Optional):
None

### Sample Variables (for testing during submission):
- **{{1}}** = `John Doe`
- **{{2}}** = `APP-2024-001`

**Preview will show:**
```
👋 Hi John Doe,

Thank you for applying to Covenant Hostel!

Your application has been received and is under review. We'll notify you once it's processed.

Application ID: APP-2024-001

- Covenant Hostel Management
```

---

## 2. Welcome New Tenant (With Variables)

### Template Details:
- **Name:** `welcome_new_tenant`
- **Category:** **UTILITY** ⚠️
- **Language:** English

### Body:
```
🎉 Welcome to Covenant Hostel, {{1}}!

Your registration is complete for Room {{2}}.

Move-in Date: {{3}}
Rent Expiry: {{4}}

Login to access your dashboard, pay bills, and request maintenance.

Portal: https://covenant-hostel.vercel.app

- Covenant Hostel Management
```

### Sample Variables:
- **{{1}}** = `John Doe`
- **{{2}}** = `24`
- **{{3}}** = `1 Nov 2024`
- **{{4}}** = `1 Nov 2025`

**Preview:**
```
🎉 Welcome to Covenant Hostel, John Doe!

Your registration is complete for Room 24.

Move-in Date: 1 Nov 2024
Rent Expiry: 1 Nov 2025

Login to access your dashboard, pay bills, and request maintenance.

Portal: https://covenant-hostel.vercel.app

- Covenant Hostel Management
```

---

## 3. Application Approved

### Template Details:
- **Name:** `application_approved`
- **Category:** **UTILITY** ⚠️
- **Language:** English

### Body:
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

### Sample Variables:
- **{{1}}** = `John Doe`

**Preview:**
```
✅ Great news, John Doe!

Your application for Covenant Hostel has been APPROVED!

Next Steps:
1. Login to complete payment
2. Schedule your move-in date
3. Review hostel guidelines

Portal: https://covenant-hostel.vercel.app

- Covenant Hostel Management
```

---

## 4. Inspection Confirmed

### Template Details:
- **Name:** `inspection_confirmed`
- **Category:** **UTILITY** ⚠️
- **Language:** English

### Body:
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

### Sample Variables:
- **{{1}}** = `John Doe`
- **{{2}}** = `24`
- **{{3}}** = `Block A`
- **{{4}}** = `15 Nov 2024`
- **{{5}}** = `10:00 AM`
- **{{6}}** = `Fee: ₦5,000 paid`

**Preview:**
```
✅ Inspection Booked!

Hi John Doe, your room inspection has been confirmed.

Room: 24
Block: Block A
Date: 15 Nov 2024
Time: 10:00 AM

Fee: ₦5,000 paid

Please arrive on time. If you need to reschedule, contact us immediately.

- Covenant Hostel Management
```

---

## 5. Payment Confirmed

### Template Details:
- **Name:** `payment_confirmed`
- **Category:** **UTILITY** ⚠️
- **Language:** English

### Body:
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

### Sample Variables:
- **{{1}}** = `John Doe`
- **{{2}}** = `500,000`
- **{{3}}** = `Full Rent Payment`
- **{{4}}** = `1 Nov 2024`
- **{{5}}** = `1 Nov 2025`

**Preview:**
```
✅ Payment Received!

Hi John Doe, your payment has been confirmed.

Amount: ₦500,000
Type: Full Rent Payment
Date: 1 Nov 2024

Your rent is now active until 1 Nov 2025.

Thank you for your payment!

- Covenant Hostel Management
```

---

## 6. Rent Expiry Reminder

### Template Details:
- **Name:** `rent_expiry_reminder`
- **Category:** **UTILITY** ⚠️
- **Language:** English

### Body:
```
Hi {{1}},

Your rent for Room {{2}} expires in {{3}} days ({{4}}).

Please renew your payment before expiry to avoid service interruption.

- Covenant Hostel Management
```

### Sample Variables:
- **{{1}}** = `John Doe`
- **{{2}}** = `24`
- **{{3}}** = `7`
- **{{4}}** = `1 Nov 2024`

**Preview:**
```
Hi John Doe,

Your rent for Room 24 expires in 7 days (1 Nov 2024).

Please renew your payment before expiry to avoid service interruption.

- Covenant Hostel Management
```

---

## 7. Installment Payment Due

### Template Details:
- **Name:** `installment_payment_due`
- **Category:** **UTILITY** ⚠️
- **Language:** English

### Body:
```
Hi {{1}},

Your installment payment for Room {{2}} is due on {{3}}.

Amount: ₦{{4}}
Installment: {{5}} of {{6}}

Please login to make your payment.

- Covenant Hostel Management
```

### Sample Variables:
- **{{1}}** = `John Doe`
- **{{2}}** = `24`
- **{{3}}** = `1 Dec 2024`
- **{{4}}** = `166,667`
- **{{5}}** = `2`
- **{{6}}** = `3`

**Preview:**
```
Hi John Doe,

Your installment payment for Room 24 is due on 1 Dec 2024.

Amount: ₦166,667
Installment: 2 of 3

Please login to make your payment.

- Covenant Hostel Management
```

---

## 📝 How to Add Variables in Meta Console

When creating the template in Facebook Business Manager:

1. **Type the message** with variable placeholders: `{{1}}`, `{{2}}`, etc.
2. **Add Sample Content** section will appear
3. **Fill in examples** for each variable (see samples above)
4. **Preview** will show how it looks with real data
5. **Submit** for approval

---

## ⚠️ Important Rules for Variables

1. **Sequential Numbers Only:** Use `{{1}}`, `{{2}}`, `{{3}}` (NOT `{{name}}` or `{{room}}`)
2. **Start at 1:** First variable is always `{{1}}`, not `{{0}}`
3. **No Gaps:** If you have 3 variables, use `{{1}}`, `{{2}}`, `{{3}}` (don't skip `{{2}}`)
4. **Samples Required:** Must provide example values for approval
5. **Keep it Simple:** Max 10 variables recommended per template

---

## ✅ Submission Checklist

For each template:
- [ ] Name is clear and descriptive
- [ ] Category is **UTILITY** (not Marketing!)
- [ ] Language is English
- [ ] Variables use `{{1}}`, `{{2}}` format
- [ ] Sample values provided for all variables
- [ ] Preview looks correct
- [ ] No promotional language
- [ ] Follows WhatsApp Business Policy

---

**Start with Welcome Applicant first, then add the others one by one!**

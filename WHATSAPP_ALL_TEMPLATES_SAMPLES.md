# WhatsApp Templates - Complete Samples with Variables Filled

**For WhatsApp Business API Submission**

All templates shown below with example data to demonstrate how variables will be used.

---

## 1️⃣ **Rent Expiry Reminder**

**Template Name:** `rent_expiry_reminder`

### Template (with variables):
```
Hi {{1}},

Your rent for Room {{2}} expires in {{3}} days ({{4}}).

Please renew your payment before expiry to avoid service interruption.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
Hi Michael Adebayo,

Your rent for Room 24 expires in 7 days (15 Dec 2026).

Please renew your payment before expiry to avoid service interruption.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Michael Adebayo (Tenant name)
- {{2}} = 24 (Room number)
- {{3}} = 7 (Days left)
- {{4}} = 15 Dec 2026 (Expiry date)

---

## 2️⃣ **Installment Payment Due**

**Template Name:** `installment_payment_due`

### Template (with variables):
```
Hi {{1}},

Your installment payment for Room {{2}} is due on {{3}}.

Amount: ₦{{4}}
Installment: {{5}} of {{6}}

Please login to make your payment.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
Hi Chioma Okafor,

Your installment payment for Room 12 is due on 20 Dec 2026.

Amount: ₦50,000
Installment: 2 of 4

Please login to make your payment.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Chioma Okafor (Tenant name)
- {{2}} = 12 (Room number)
- {{3}} = 20 Dec 2026 (Due date)
- {{4}} = 50,000 (Amount)
- {{5}} = 2 (Current installment number)
- {{6}} = 4 (Total installments)

---

## 3️⃣ **Recurring Charge Due**

**Template Name:** `recurring_charge_due`

### Template (with variables):
```
Hi {{1}},

You have a recurring charge due for Room {{2}}.

Charge: {{3}}
Amount: ₦{{4}}
Due: {{5}}

Please login to settle this charge.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
Hi Tunde Bakare,

You have a recurring charge due for Room 8.

Charge: Electricity Bill
Amount: ₦5,000
Due: 1 Jan 2027

Please login to settle this charge.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Tunde Bakare (Tenant name)
- {{2}} = 8 (Room number)
- {{3}} = Electricity Bill (Charge description)
- {{4}} = 5,000 (Amount)
- {{5}} = 1 Jan 2027 (Due date)

---

## 4️⃣ **Payment Overdue Alert**

**Template Name:** `payment_overdue`

### Template (with variables):
```
⚠️ URGENT: Hi {{1}},

Your payment for Room {{2}} is now OVERDUE.

Amount: ₦{{3}}
Due Date: {{4}}

Please make payment immediately to avoid late fees or service interruption.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
⚠️ URGENT: Hi Blessing Eze,

Your payment for Room 15 is now OVERDUE.

Amount: ₦75,000
Due Date: 5 Dec 2026

Please make payment immediately to avoid late fees or service interruption.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Blessing Eze (Tenant name)
- {{2}} = 15 (Room number)
- {{3}} = 75,000 (Amount)
- {{4}} = 5 Dec 2026 (Original due date)

---

## 5️⃣ **Rent Expired Notification**

**Template Name:** `rent_expired`

### Template (with variables):
```
Hi {{1}},

Your rent for Room {{2}} has expired as of {{3}}.

Please renew immediately to continue your stay. Portal access has been restricted until payment is made.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
Hi Emmanuel Nwosu,

Your rent for Room 31 has expired as of 10 Dec 2026.

Please renew immediately to continue your stay. Portal access has been restricted until payment is made.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Emmanuel Nwosu (Tenant name)
- {{2}} = 31 (Room number)
- {{3}} = 10 Dec 2026 (Expiry date)

---

## 6️⃣ **Maintenance Assignment (Provider)**

**Template Name:** `maintenance_assigned_provider`

### Template (with variables):
```
Hi {{1}},

You have been assigned a maintenance task for Room {{2}}.

Issue: {{3}}

Tenant Contact: {{4}}

Please contact the tenant to schedule and complete the maintenance.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
Hi John the Electrician,

You have been assigned a maintenance task for Room 18.

Issue: Socket not working in the bedroom area

Tenant Contact: +2348090791947

Please contact the tenant to schedule and complete the maintenance.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = John the Electrician (Provider name)
- {{2}} = 18 (Room number)
- {{3}} = Socket not working in the bedroom area (Issue description)
- {{4}} = +2348090791947 (Tenant phone number)

---

## 7️⃣ **Registration Incomplete Reminder**

**Template Name:** `registration_incomplete`

### Template (with variables):
```
👋 Hi {{1}},

You started an application for Covenant Hostel but didn't finish.

Pick up right where you left off.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
👋 Hi Fatima Ibrahim,

You started an application for Covenant Hostel but didn't finish.

Pick up right where you left off.

- Covenant Hostel Management

[Continue Application] ← Button opens: https://covenanthostel.com/register?resume=fatima@example.com
```

**Variables:**
- {{1}} = Fatima Ibrahim (Applicant name)
- {{2}} = fatima%40example.com (URL-encoded email)

**Button (Call-to-Action):**
- Text: "Continue Application"
- URL in Twilio: `https://covenanthostel.com/register?resume={{2}}`
- Actual URL user sees: `https://covenanthostel.com/register?resume=fatima%40example.com`

---

## 8️⃣ **Welcome New Tenant**

**Template Name:** `welcome_new_tenant`

### Template (with variables):
```
🎉 Welcome to Covenant Hostel, {{1}}!

Your tenancy for Room {{2}} is now active.

View your move-in date, rent expiry, and access your dashboard to pay bills and request maintenance.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
🎉 Welcome to Covenant Hostel, Michael Adebayo!

Your tenancy for Room 24 is now active.

View your move-in date, rent expiry, and access your dashboard to pay bills and request maintenance.

- Covenant Hostel Management

[Open Dashboard] ← Button
```

**Variables:**
- {{1}} = Michael Adebayo (Tenant name)
- {{2}} = 24 (Room number)

**Button (Static URL):**
- Text: "Open Dashboard"
- URL: https://covenanthostel.com/login

---

## 9️⃣ **Welcome New Applicant**

**Template Name:** `welcome_applicant`

### Template (with variables):
```
👋 Hi {{1}},

Thank you for applying to Covenant Hostel!

Your application has been received and is under review. We'll notify you once it's processed.

Application ID: {{2}}

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
👋 Hi Chioma Okafor,

Thank you for applying to Covenant Hostel!

Your application has been received and is under review. We'll notify you once it's processed.

Application ID: cm2x5abc12345

- Covenant Hostel Management

[View Application] ← Button
```

**Variables:**
- {{1}} = Chioma Okafor (Applicant name)
- {{2}} = cm2x5abc12345 (Application ID)

**Button (Static URL):**
- Text: "View Application"
- URL: https://covenanthostel.com/login

---

## 🔟 **Application Approved**

**Template Name:** `application_approved`  
**Type:** Text Template (no button)

### Template (with variables):
```
✅ Great news, {{1}}!

Your application for Covenant Hostel has been APPROVED!

📧 Check your email for instructions to:
1. Create your password
2. Complete payment
3. Move in

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
✅ Great news, Tunde Bakare!

Your application for Covenant Hostel has been APPROVED!

📧 Check your email for instructions to:
1. Create your password
2. Complete payment
3. Move in

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Tunde Bakare (Applicant name)

**Note:** This is a notification template. The email contains the password setup link with a unique secure token.

---

## 1️⃣1️⃣ **Inspection Booking Confirmed**

**Template Name:** `inspection_confirmed`

### Template (with variables):
```
✅ Inspection Booked!

Hi {{1}}, your room inspection has been confirmed.

Room: {{2}}
Block: {{3}}
Date: {{4}}

{{5}}

Please arrive on time. If you need to reschedule, contact us immediately.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
✅ Inspection Booked!

Hi Ada Okonkwo, your room inspection has been confirmed.

Room: 7
Block: Block A
Date: 18 Dec 2026 at 2:00 PM

Fee: ₦5,000 paid

Please arrive on time. If you need to reschedule, contact us immediately.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Ada Okonkwo (Guest name)
- {{2}} = 7 (Room number)
- {{3}} = Block A (Block name)
- {{4}} = 18 Dec 2026 at 2:00 PM (Inspection date with time)
- {{5}} = Fee: ₦5,000 paid (Fee message)

**Note:** Time is included in the date variable since there's no separate time field in schema.

---

## 1️⃣2️⃣ **Inspection Reminder (24h before)**

**Template Name:** `inspection_reminder`

### Template (with variables):
```
⏰ Inspection Tomorrow!

Hi {{1}}, this is a reminder about your room inspection.

Room: {{2}}
Date: {{3}}
Location: {{4}}

Please bring a valid ID and arrive on time.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
⏰ Inspection Tomorrow!

Hi Ada Okonkwo, this is a reminder about your room inspection.

Room: 7
Date: 18 Dec 2026 at 2:00 PM
Location: Block A, Covenant University Campus

Please bring a valid ID and arrive on time.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Ada Okonkwo (Guest name)
- {{2}} = 7 (Room number)
- {{3}} = 18 Dec 2026 at 2:00 PM (Inspection date with time)
- {{4}} = Block A, Covenant University Campus (Location)

**Note:** Time is included in the date variable since there's no separate time field in schema.

---

## 1️⃣3️⃣ **Payment Confirmation**

**Template Name:** `payment_confirmed`

### Template (with variables):
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

### Sample Output (what user sees):
```
✅ Payment Received!

Hi Michael Adebayo, your payment has been confirmed.

Amount: ₦150,000
Type: Full Payment
Date: 8 Dec 2026

Your rent is now active until 8 Jun 2027.

Thank you for your payment!

- Covenant Hostel Management
```

**Variables:**
- {{1}} = Michael Adebayo (Tenant name)
- {{2}} = 150,000 (Amount paid)
- {{3}} = Full Payment (Payment type)
- {{4}} = 8 Dec 2026 (Payment date)
- {{5}} = 8 Jun 2027 (New expiry date)

---

## 1️⃣4️⃣ **General Announcement**

**Template Name:** `general_announcement`

### Template (with variables):
```
📢 Important Announcement

Hi {{1}},

{{2}}

If you have any questions, please don't hesitate to reach out to us.

- Covenant Hostel Management
```

### Sample Output (what user sees):
```
📢 Important Announcement

Hi All Tenants,

The hostel will be closed for Christmas break from December 20 to January 5. Please plan accordingly and ensure all payments are up to date before the closure.

If you have any questions, please don't hesitate to reach out to us.

- Covenant Hostel Management
```

**Variables:**
- {{1}} = All Tenants (Recipient name/group)
- {{2}} = The hostel will be closed for Christmas break from December 20 to January 5. Please plan accordingly and ensure all payments are up to date before the closure. (Custom announcement message)

**Note:** Message length increased to meet WhatsApp's minimum requirement for templates with variables.

---

## 📊 Summary Table

| # | Template Name | Variables | Has Button? |
|---|---|---|---|
| 1 | rent_expiry_reminder | 4 | No |
| 2 | installment_payment_due | 6 | No |
| 3 | recurring_charge_due | 5 | No |
| 4 | payment_overdue | 4 | No |
| 5 | rent_expired | 3 | No |
| 6 | maintenance_assigned_provider | 4 | No |
| 7 | registration_incomplete | 2 | Yes (Static with variable) |
| 8 | welcome_new_tenant | 2 | Yes (Static) |
| 9 | welcome_applicant | 1 | No |
| 10 | application_approved | 1 | No (text template) |
| 11 | inspection_confirmed | 5 | No |
| 12 | inspection_reminder | 4 | No |
| 13 | payment_confirmed | 5 | No |
| 14 | general_announcement | 2 | No |

---

## 📝 Notes for WhatsApp Review

**Business Use Case:** Covenant Hostel Management System

**Purpose of Messages:**
- Rent and payment reminders (transactional)
- Maintenance notifications (service updates)
- Application status updates (account notifications)
- Inspection scheduling (appointment confirmations)

**Message Frequency:**
- Rent reminders: 7 days, 3 days, 1 day before expiry
- Installment reminders: On due date
- Payment confirmations: Immediately after payment
- Welcome messages: One-time on registration/approval
- Maintenance updates: As needed per request

**Category:** All templates are **Utility** (transactional/account updates), not marketing.

**Opt-in:** Users provide phone numbers during registration and consent to receive hostel management notifications.

---

**Prepared for:** WhatsApp Business API Approval  
**Business Name:** Covenant Hostel  
**Website:** https://covenanthostel.com/login  
**Total Templates:** 14 (10 without buttons, 4 with buttons)

# Recurring Charges Implementation

## Overview
Implemented a complete recurring billing system that automatically generates charges, sends reminders, and allows tenants to pay them via Paystack or receipt upload.

---

## What Was Built

### 1. Database Schema
**New Model: `RecurringCharge`**
- Tracks per-tenant instances of recurring billing rules
- Fields: `tenantId`, `billingRuleId`, `amount`, `dueDate`, `status`, `paymentId`
- Status enum: `UNPAID`, `PENDING`, `PAID`, `OVERDUE`
- Links to `Payment` when settled

**Updated Models:**
- `BillingRule` → added `recurringCharges` relation
- `TenantProfile` → added `recurringCharges` relation
- `Payment` → added `recurringCharge` relation

---

### 2. API Routes

**`/api/payments/recurring-charges` (GET)**
- Fetches all recurring charges for the logged-in tenant
- Includes billing rule details and linked payment

**`/api/payments` (POST) — Extended**
- Now accepts `recurringChargeId` parameter
- When paying a recurring charge, marks it `PENDING` (receipt) or `PAID` (Paystack)
- Sets `paymentType` to `"RECURRING"`

**`/api/payments/verify` (POST) — Extended**
- Accepts `recurringChargeId` in Paystack verification
- Marks the charge `PAID` and links the payment

**`/api/payments/[id]/approve` (POST) — Extended**
- When approving a receipt payment, checks if it's linked to a recurring charge
- Marks the charge `PAID` on approval

---

### 3. Cron Job (`/api/cron/rent-reminders`)

**New Logic:**
1. **Mark Overdue Charges** — Any `UNPAID` charge past its `dueDate` flips to `OVERDUE`
2. **Generate Recurring Charges** — For each active tenant:
   - Finds applicable recurring billing rules (global, block, or room-specific)
   - Calculates next due date based on frequency (DAILY, MONTHLY, QUARTERLY, YEARLY, PER_SEMESTER)
   - Creates a `RecurringCharge` record if one doesn't exist for the current cycle
3. **Send Reminders** — 7, 3, and 1 day before due date:
   - Emails tenant with charge details
   - Alerts admin/landlord

**Email Templates Added:**
- `sendRecurringChargeDueReminder` — tenant notification
- `sendAdminRecurringChargeAlert` — landlord notification

---

### 4. Tenant UI (`/tenant/payments`)

**Updated `isFullyPaid` Logic:**
- Now checks: base rent paid + no outstanding recurring charges
- Tenant only sees "Paid in Full" when everything is settled

**Recurring Charges Section:**
- **When unpaid charges exist:**
  - Shows "Recurring Charges Due" card with red badge
  - Each charge has a payment form (Paystack or receipt upload)
  - Inline payment without leaving the page
- **When all charges are paid:**
  - Shows "Recurring Charges" card with frequency info (informational only)

**Payment Form Component:**
- `RecurringChargePaymentForm.js` — client component
- Supports both Paystack and receipt upload
- Shows charge title, due date, amount
- Success state with auto-refresh

---

### 5. Landlord UI (`/landlord/payments`)

**Payment Type Column:**
- Now shows "Recurring" badge for `paymentType === "RECURRING"`
- Distinguishes from "Full" and "Installment" payments

**Approval Flow:**
- Landlord approves/rejects recurring charge receipts same as regular payments
- On approval, the linked `RecurringCharge` status updates to `PAID`

---

## How It Works End-to-End

### Scenario: Monthly Service Charge

1. **Setup (Landlord):**
   - Creates a `BillingRule` with `frequency: MONTHLY`, `amount: 5000`, `isGlobal: true`

2. **Charge Generation (Cron):**
   - Runs daily at scheduled time
   - Finds all active tenants
   - For each tenant, checks if a charge exists for this rule in the current cycle
   - If not, creates a `RecurringCharge` with `dueDate` = today + 1 month
   - Status: `UNPAID`

3. **Reminders (Cron):**
   - 7 days before due: sends email to tenant + landlord
   - 3 days before due: sends email again
   - 1 day before due: final reminder

4. **Tenant Payment:**
   - Tenant logs in, sees "Recurring Charges Due" card
   - Clicks "Pay via Paystack" or uploads receipt
   - **Paystack:** charge marked `PAID` immediately, payment record created
   - **Receipt:** charge marked `PENDING`, landlord must approve

5. **Landlord Approval (if receipt):**
   - Landlord sees payment in approval queue with "Recurring" badge
   - Approves → charge flips to `PAID`
   - Rejects → charge stays `UNPAID`, tenant notified

6. **Overdue Handling (Cron):**
   - If `dueDate` passes and charge is still `UNPAID`, status → `OVERDUE`
   - Tenant's `isFullyPaid` remains `false` until settled

7. **Next Cycle:**
   - Next month, cron generates a new `RecurringCharge` for the same rule
   - Process repeats

---

## Key Design Decisions

**Why `RecurringCharge` instead of just `Payment`?**
- `Payment` represents a transaction (money moved)
- `RecurringCharge` represents an obligation (money owed)
- A charge can exist before payment is made
- Allows tracking of unpaid/overdue obligations separately from payment history

**Why generate charges in the cron, not on-demand?**
- Ensures charges exist before due date (for reminders)
- Decouples charge creation from tenant login
- Landlord can see upcoming obligations in advance

**Why not auto-charge tenants?**
- Requires stored payment methods (PCI compliance burden)
- Tenant may want to pay via bank transfer
- Gives tenant control over payment timing

---

## Testing Checklist

- [ ] Create a monthly billing rule
- [ ] Run cron job manually: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/rent-reminders`
- [ ] Verify `RecurringCharge` records created for active tenants
- [ ] Check tenant sees "Recurring Charges Due" card
- [ ] Pay via Paystack → charge marked `PAID`
- [ ] Upload receipt → charge marked `PENDING`
- [ ] Landlord approves receipt → charge marked `PAID`
- [ ] Manually set `dueDate` to yesterday, run cron → charge marked `OVERDUE`
- [ ] Verify emails sent at 7/3/1 day thresholds

---

## Future Enhancements

1. **Landlord Dashboard:**
   - Show all upcoming recurring charges across tenants
   - Revenue forecasting based on recurring rules

2. **Tenant Payment History:**
   - Filter by payment type (Full, Installment, Recurring)
   - Export to PDF/CSV

3. **Auto-Payment:**
   - Allow tenants to save card and enable auto-pay
   - Charge automatically on due date

4. **Grace Periods:**
   - Add `gracePeriodDays` to `BillingRule`
   - Don't mark `OVERDUE` until grace period expires

5. **Late Fees:**
   - Auto-generate additional charge when payment is overdue
   - Configurable late fee amount/percentage

6. **Proration:**
   - When tenant moves in mid-cycle, prorate the first charge
   - Calculate based on days remaining in cycle

---

## Files Changed

### Schema
- `prisma/schema.prisma` — added `RecurringCharge` model and relations

### API Routes
- `src/app/api/payments/recurring-charges/route.js` — new
- `src/app/api/payments/route.js` — extended for recurring charges
- `src/app/api/payments/verify/route.js` — extended for recurring charges
- `src/app/api/payments/[id]/approve/route.js` — extended for recurring charges
- `src/app/api/cron/rent-reminders/route.js` — added charge generation + overdue marking

### Email
- `src/lib/email.js` — added `sendRecurringChargeDueReminder` and `sendAdminRecurringChargeAlert`

### Tenant UI
- `src/app/tenant/payments/page.js` — updated `isFullyPaid` logic, added recurring charges section
- `src/components/RecurringChargePaymentForm.js` — new client component

### Landlord UI
- `src/app/landlord/payments/PaymentApprovalClient.js` — added "Recurring" badge

---

## Migration

Run:
```bash
npx prisma db push
npx prisma generate
```

No data migration needed — existing payments unaffected.

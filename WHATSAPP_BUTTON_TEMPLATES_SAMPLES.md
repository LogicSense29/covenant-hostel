# WhatsApp Button Templates - Complete Samples

## 📋 Templates with Buttons (4 Total)

---

## 1️⃣ **Welcome New Tenant**

### **Template Configuration (Twilio Console)**

**Template Name:** `welcome_new_tenant`

**Body:**
```
🎉 Welcome to Covenant Hostel, {{1}}!

Your tenancy for Room {{2}} is now active.

View your move-in date, rent expiry, and access your dashboard to pay bills and request maintenance.

- Covenant Hostel Management
```

**Variables:**
- `{{1}}` = Tenant name
- `{{2}}` = Room number

**Button:**
- **Type:** URL (Static)
- **Text:** "Open Dashboard"
- **URL:** `https://covenanthostel.com`

### **Sample Output (What User Sees)**

```
🎉 Welcome to Covenant Hostel, Michael Adebayo!

Your tenancy for Room 24 is now active.

View your move-in date, rent expiry, and access your dashboard to pay bills and request maintenance.

- Covenant Hostel Management

┌─────────────────────────┐
│   🔗 Open Dashboard     │  ← Clickable Button
└─────────────────────────┘
```

### **Code Usage**

```javascript
// Already implemented in: src/app/api/landlord/activate-tenancy/route.js
const payload = buildWelcomeNewTenant({ 
  name: "Michael Adebayo", 
  roomNumber: "24" 
});

await sendWhatsAppMessage({ 
  to: "+2348090791947", 
  ...payload 
});
```

**Variables Sent:**
```json
{
  "contentSid": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "contentVariables": {
    "1": "Michael Adebayo",
    "2": "24"
  }
}
```

---

## 2️⃣ **Welcome New Applicant**

### **Template Configuration (Twilio Console)**

**Template Name:** `welcome_applicant`

**Body:**
```
👋 Welcome to Covenant Hostel, {{1}}!

Thank you for choosing us. Your application has been received and is currently under review.

We'll notify you via email and WhatsApp once your application is processed.

Looking forward to hosting you!

- Covenant Hostel Management
```

**Variables:**
- `{{1}}` = Applicant name

**Button:**
None

### **Sample Output (What User Sees)**

```
👋 Welcome to Covenant Hostel, Chioma Okafor!

Thank you for choosing us. Your application has been received and is currently under review.

We'll notify you via email and WhatsApp once your application is processed.

Looking forward to hosting you!

- Covenant Hostel Management
```

┌─────────────────────────┐
│  🔗 View Application    │  ← Clickable Button
└─────────────────────────┘
```

### **Code Usage**

```javascript
// Already implemented in: src/app/api/auth/register/route.js
const payload = buildWelcomeApplicant({ 
  name: "Chioma Okafor"
});

await sendWhatsAppMessage({ 
  to: "+2347061234567", 
  ...payload 
});
```

**Variables Sent:**
```json
{
  "contentSid": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "contentVariables": {
    "1": "Chioma Okafor",
    "2": "cm2x5abc12345"
  }
}
```

---

## 3️⃣ **Application Approved** (CHANGED TO TEXT TEMPLATE)

### **Template Configuration (Twilio Console)**

**Template Name:** `application_approved`  
**Type:** Text Template (no button)

**Body:**
```
✅ Great news, {{1}}!

Your application for Covenant Hostel has been APPROVED!

📧 Check your email for instructions to:
1. Create your password
2. Complete payment
3. Move in

- Covenant Hostel Management
```

**Variables:**
- `{{1}}` = Applicant name

**Note:** This template was changed from a button template to a text template because the password setup link requires a unique token that is sent via email.

### **Sample Output (What User Sees)**

```
✅ Great news, Tunde Bakare!

Your application for Covenant Hostel has been APPROVED!

📧 Check your email for instructions to:
1. Create your password
2. Complete payment
3. Move in

- Covenant Hostel Management
```

### **Code Usage**

```javascript
// Usage in: When landlord approves application
const payload = buildApplicationApproved({ 
  name: "Tunde Bakare" 
});

await sendWhatsAppMessage({ 
  to: "+2348123456789", 
  ...payload 
});
```

**Variables Sent:**
```json
{
  "contentSid": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "contentVariables": {
    "1": "Tunde Bakare"
  }
}
```

---

## 4️⃣ **Registration Incomplete** (Dynamic Button)

### **Template Configuration (Twilio Console)**

**Template Name:** `registration_incomplete`

**Body:**
```
👋 Hi {{1}},

You started an application for Covenant Hostel but didn't finish.

Pick up right where you left off.

- Covenant Hostel Management
```

**Variables:**
- `{{1}}` = Applicant name

**Button:**
- **Type:** URL (Dynamic) ⚠️ **Important!**
- **Text:** "Continue Application"
- **URL:** `{{1}}` ← This is the button URL parameter

### **Sample Output (What User Sees)**

```
👋 Hi Blessing Eze,

You started an application for Covenant Hostel but didn't finish.

Pick up right where you left off.

- Covenant Hostel Management

┌─────────────────────────────┐
│  🔗 Continue Application    │  ← Clickable Button
└─────────────────────────────┘
```

When clicked, button opens: `https://covenanthostel.com/auth/register?resume=abc123xyz`

### **Code Usage**

```javascript
// Already implemented in: src/app/api/cron/registration-reminders/route.js
const payload = buildRegistrationIncomplete({ 
  name: "Blessing Eze",
  resumeUrl: "https://covenanthostel.com/auth/register?resume=abc123xyz"
});

await sendWhatsAppMessage({ 
  to: "+2349087654321", 
  ...payload 
});
```

**Variables Sent:**
```json
{
  "contentSid": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "contentVariables": {
    "1": "Blessing Eze"
  },
  "buttonVariables": {
    "1": "https://covenanthostel.com/auth/register?resume=abc123xyz"
  }
}
```

**⚠️ Important Notes:**
- Body variable `{{1}}` = Name
- Button variable `{{1}}` = Resume URL (separate from body variables)
- The `resumeUrl` is passed via `buttonVariables`, not `contentVariables`

---

## 📊 Summary Table

| # | Template | Variables | Button Type | Button Text | Button URL |
|---|---|---|---|---|---|
| 1 | Welcome New Tenant | 2 | Static | "Open Dashboard" | `covenanthostel.com` |
| 2 | Welcome Applicant | 2 | Static | "View Application" | `covenanthostel.com` |
| 3 | Application Approved | 1 | Static | "Login Now" | `covenanthostel.com` |
| 4 | Registration Incomplete | 1 + button | Dynamic | "Continue Application" | Personalized URL |

---

## 🎯 How to Configure in Twilio Console

### **For Static Buttons (Templates 1-3):**

1. Go to: https://console.twilio.com/us1/develop/sms/content-editor
2. Click **"Create Template"**
3. **Template Name:** Use exact name (e.g., `welcome_new_tenant`)
4. **Category:** Utility
5. **Language:** English
6. **Body:** Paste the template text with `{{1}}`, `{{2}}`, etc.
7. Scroll to **"Components"** section
8. Click **"+ Add Component"** → **"Buttons"**
9. Configure button:
   - **Button Type:** URL
   - **Text:** "Open Dashboard" (exactly as shown)
   - **URL Type:** Static
   - **URL:** `https://covenanthostel.com`
10. Click **"Submit for Approval"**

### **For Dynamic Button (Template 4):**

1-7. Same as above
8. Click **"+ Add Component"** → **"Buttons"**
9. Configure button:
   - **Button Type:** URL
   - **Text:** "Continue Application"
   - **URL Type:** Dynamic
   - **URL:** `{{1}}` ← Enter this exactly
10. Click **"Submit for Approval"**

---

## 🧪 Testing After Approval

### **Test Welcome New Tenant:**
```bash
# Activate a tenant through the dashboard
# Or use the API directly
POST /api/landlord/activate-tenancy
```

### **Test Welcome Applicant:**
```bash
# Complete a new registration
POST /api/auth/register
```

### **Test Application Approved:**
```bash
# Approve an applicant through landlord dashboard
PUT /api/landlord/tenants/:id/approve
```

### **Test Registration Incomplete:**
```bash
# Wait for cron job or trigger manually
GET /api/cron/registration-reminders
```

---

## ✅ Checklist

Before submitting to Twilio:

- [ ] All 4 template names match exactly (lowercase, underscores)
- [ ] Variable placeholders use correct format: `{{1}}`, `{{2}}`, etc.
- [ ] Button text is 25 characters or less
- [ ] Static button URL is `https://covenanthostel.com` (no trailing slash)
- [ ] Dynamic button URL is exactly `{{1}}` (not `{{2}}` or any other number)
- [ ] Template category is set to "Utility"
- [ ] Language is set to "English"

After approval:

- [ ] Copy all 4 Content SIDs from Twilio
- [ ] Add to `.env` file:
  ```bash
  WHATSAPP_TEMPLATE_WELCOME_TENANT="HXxxxxx..."
  WHATSAPP_TEMPLATE_WELCOME_APPLICANT="HXxxxxx..."
  WHATSAPP_TEMPLATE_APP_APPROVED="HXxxxxx..."
  WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE="HXxxxxx..."
  ```
- [ ] Redeploy application
- [ ] Test each template

---

**Created:** Now  
**Status:** Ready for Twilio submission  
**Total Button Templates:** 3 (2 static, 1 dynamic)

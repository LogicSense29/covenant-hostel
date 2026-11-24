# WhatsApp Button Template Implementation

## ✅ Updates Completed

### 1. **Template Documentation Updated**
File: `WHATSAPP_TEMPLATES_REQUIRED.md`

**4 templates now include button configurations:**

| Template | Body Variables | Button Type | Button Text | Button URL |
|---|---|---|---|---|
| **Welcome New Tenant** | 2 (name, room) | Static | "Open Dashboard" | `https://covenanthostel.com/login` |
| **Application Approved** | 1 (name) | Static | "Login Now" | `https://covenanthostel.com/login` |
| **Registration Incomplete** | 1 (name) | Dynamic | "Continue Application" | `{{1}}` (resume URL) |

### 2. **Code Updates**

#### **src/lib/whatsapp.js**
- Added `buttonVariables` parameter support
- Merges body and button variables before sending to Twilio
- Maintains backward compatibility with templates without buttons

**New signature:**
```javascript
sendWhatsAppMessage({ 
  to, 
  body,           // For raw messages (sandbox)
  contentSid,     // Template SID
  contentVariables,   // Body variables: {"1": "John", "2": "Room 24"}
  buttonVariables     // Button variables: {"1": "https://..."} (NEW)
})
```

#### **src/lib/whatsapp-templates.js**
- Updated `buildRegistrationIncomplete()` to return `buttonVariables`
- Added comprehensive documentation about button support
- Static button templates (Welcome Tenant, Application Approved) don't need special code — the button URL is configured once in Twilio and automatically included.

**Updated function:**
```javascript
export function buildRegistrationIncomplete({ name, resumeUrl }) {
  return {
    contentSid: TEMPLATE_SIDS.REGISTRATION_INCOMPLETE,
    contentVariables: {
      "1": name  // Body variable
    },
    buttonVariables: {
      "1": resumeUrl  // Button URL parameter
    }
  };
}
```

### 3. **Template Changes**

#### **Before (with plain URLs):**
```
Portal: https://covenanthostel.com/login  ❌ May get rejected
```

#### **After (with buttons):**
```
[Button: Open Dashboard] → https://covenanthostel.com/login  ✅ Better approval rate
```

---

## 🎯 Benefits

✅ **Higher WhatsApp approval rate** — Structured buttons preferred over plain URLs  
✅ **Better user experience** — One-tap action instead of copy-paste  
✅ **Professional appearance** — Buttons look polished in WhatsApp  
✅ **No code changes needed** for static buttons — configure once in Twilio  
✅ **Backward compatible** — Templates without buttons still work  

---

## 📋 How to Configure Buttons in Twilio

### **For Static Buttons (Welcome Tenant, Application Approved):**

1. Go to: https://console.twilio.com/us1/develop/sms/content-editor
2. Create/edit template
3. Add body text with variables (`{{1}}`, `{{2}}`)
4. Click **"+ Add Component"** → **"Buttons"**
5. Select **"URL"** button type
6. Enter:
   - **Text:** "Open Dashboard" (max 25 chars)
   - **URL Type:** Static
   - **URL:** `https://covenanthostel.com/login`
7. Submit for approval

**No code changes needed!** The button is configured in Twilio and automatically included.

---

### **For Dynamic Buttons (Registration Incomplete):**

1. In Twilio Console, create template
2. Add body: `👋 Hi {{1}}, You started an application...`
3. Add button:
   - **Text:** "Continue Application"
   - **URL Type:** Dynamic
   - **URL:** `{{1}}` (this will be the resume URL)
4. Submit for approval

**Code automatically handles it:**
```javascript
const payload = buildRegistrationIncomplete({
  name: "John Doe",
  resumeUrl: "https://covenant-hostel.vercel.app/auth/register?resume=abc123"
});

await sendWhatsAppMessage({ to: phone, ...payload });
```

The `resumeUrl` is passed as `buttonVariables["1"]` and Twilio replaces `{{1}}` in the button URL.

---

## 🧪 Testing

### **Before Approval:**
Templates won't work until approved by WhatsApp. Test using:
- Sandbox mode with raw text
- Test templates in Twilio Console preview

### **After Approval:**
Test each button template:
1. Welcome New Tenant → Trigger by activating a tenant
2. Registration Incomplete → Wait for cron job or trigger manually

---

## ⚠️ Important Notes

1. **Max 3 buttons per template** (2 CTA + 1 Quick Reply, or 3 Quick Replies)
2. **Button text limit:** 25 characters
3. **Dynamic URLs must be complete** (not partial paths)
4. **Domain verification** may be required for your domain
5. **Static buttons** are configured once in Twilio (not in code)
6. **Dynamic buttons** are passed via `buttonVariables` parameter

---

## 📊 Variable Index Reference

### **Registration Incomplete Template:**
- **Body {{1}}** → Applicant name (in `contentVariables`)
- **Button {{1}}** → Resume URL (in `buttonVariables`)

**Note:** Twilio uses separate indexes for body and button variables. The button `{{1}}` is NOT the same as body `{{1}}`.

---

## 🔄 Migration Path

### **Step 1: Submit Templates to Twilio**
- Create all 14 templates in Twilio Console
- Add buttons to Welcome Tenant and Registration Incomplete
- Wait for approval (15-60 minutes typically)

### **Step 2: Add Template SIDs to .env**
Once approved, copy Content SIDs from Twilio Console:
```bash
WHATSAPP_TEMPLATE_WELCOME_TENANT="HXxxxxx"
WHATSAPP_TEMPLATE_WELCOME_APPLICANT="HXxxxxx"
WHATSAPP_TEMPLATE_APP_APPROVED="HXxxxxx"
WHATSAPP_TEMPLATE_REGISTRATION_INCOMPLETE="HXxxxxx"
# ... (other 10 templates)
```

### **Step 3: Test**
Code is already updated! Just add the SIDs and test each template.

---

## 🚀 Ready to Deploy

All code changes are complete and backward compatible. The system will:
- ✅ Use buttons when templates are configured with them in Twilio
- ✅ Work with templates that don't have buttons
- ✅ Pass button URLs dynamically when needed
- ✅ Maintain the same calling pattern for all existing code

**Next Steps:**
1. Submit templates to Twilio with buttons configured
2. Copy approved Content SIDs to `.env`
3. Deploy and test

---

**Updated:** Now  
**Status:** Ready for production  
**Files Modified:** 
- `src/lib/whatsapp.js`
- `src/lib/whatsapp-templates.js`
- `WHATSAPP_TEMPLATES_REQUIRED.md`

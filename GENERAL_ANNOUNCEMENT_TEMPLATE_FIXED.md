# General Announcement Template - FIXED VERSION

## ❌ Problem with Original Template

**Rejection Reason:**
```
Type: OAuthException
Code: 100, SubCode: 2388293
Message: This template has too many variables for its length. 
Reduce the number of variables or increase the message length.
```

**Original Template (TOO SHORT):**
```
Hi {{1}},

{{2}}

- Covenant Hostel Management
```

WhatsApp requires a **minimum message length** when using variables. The original was too short with only 2 variables.

---

## ✅ FIXED VERSION - Submit This to Twilio

### **Template Name:** `general_announcement`

### **Category:** UTILITY

### **Language:** English

### **Body Text:**
```
📢 Important Announcement

Hi {{1}},

{{2}}

If you have any questions, please don't hesitate to reach out to us.

- Covenant Hostel Management
```

### **Sample Variables:**
- **{{1}}** = `All Tenants`
- **{{2}}** = `The hostel will be closed for Christmas break from December 20 to January 5. Please plan accordingly and ensure all payments are up to date before the closure.`

### **Preview:**
```
📢 Important Announcement

Hi All Tenants,

The hostel will be closed for Christmas break from December 20 to January 5. Please plan accordingly and ensure all payments are up to date before the closure.

If you have any questions, please don't hesitate to reach out to us.

- Covenant Hostel Management
```

---

## 📝 What Changed:

1. ✅ **Added header:** "📢 Important Announcement" - makes it more official
2. ✅ **Added footer text:** "If you have any questions, please don't hesitate to reach out to us." - increases message length
3. ✅ **Changed name:** `general_notification` → `general_announcement` (more descriptive)
4. ✅ **Longer sample message** for variable {{2}}

**Total Length:** ~220 characters (meets WhatsApp minimum)

---

## 🔧 Code Updated

**File:** `src/lib/whatsapp-templates.js`

```javascript
export const TEMPLATE_SIDS = {
  // ...
  GENERAL_ANNOUNCEMENT: process.env.WHATSAPP_TEMPLATE_GENERAL || null,
};

export function buildGeneralAnnouncement({ recipientName, message }) {
  return {
    contentSid: TEMPLATE_SIDS.GENERAL_ANNOUNCEMENT,
    contentVariables: {
      "1": recipientName,
      "2": message
    }
  };
}
```

**Usage:**
```javascript
await sendWhatsAppMessage({
  to: "+2348123456789",
  ...buildGeneralAnnouncement({
    recipientName: "All Tenants",
    message: "The hostel will be closed for Christmas break from December 20 to January 5. Please plan accordingly and ensure all payments are up to date before the closure."
  })
});
```

---

## ✅ Ready to Submit

This fixed version meets WhatsApp's requirements:
- ✅ Sufficient message length
- ✅ Clear purpose (announcements)
- ✅ Professional formatting
- ✅ 2 variables properly spaced

**Delete the old rejected template in Twilio Console and submit this new version!**

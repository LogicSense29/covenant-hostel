/**
 * WhatsApp Message Template SIDs
 * 
 * These are the approved WhatsApp Business API template Content SIDs from Twilio.
 * Find them at: https://console.twilio.com/us1/develop/sms/content-editor
 * 
 * UPDATE THESE with your actual template SIDs after approval!
 */

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

/**
 * Helper function to send rent expiry reminder
 */
export function buildRentExpiryReminder({ name, roomNumber, daysLeft, expiryDate }) {
  return {
    contentSid: TEMPLATE_SIDS.RENT_EXPIRY_REMINDER,
    contentVariables: {
      "1": name,
      "2": roomNumber,
      "3": daysLeft.toString(),
      "4": expiryDate
    }
  };
}

/**
 * Helper function to send installment payment due reminder
 */
export function buildInstallmentDueReminder({ name, roomNumber, dueDate, amount, installmentNum, totalInstallments }) {
  return {
    contentSid: TEMPLATE_SIDS.INSTALLMENT_PAYMENT_DUE,
    contentVariables: {
      "1": name,
      "2": roomNumber,
      "3": dueDate,
      "4": amount.toLocaleString(),
      "5": installmentNum.toString(),
      "6": totalInstallments.toString()
    }
  };
}

/**
 * Helper function to send payment overdue alert
 */
export function buildPaymentOverdueAlert({ name, roomNumber, amount, dueDate }) {
  return {
    contentSid: TEMPLATE_SIDS.PAYMENT_OVERDUE,
    contentVariables: {
      "1": name,
      "2": roomNumber,
      "3": amount.toLocaleString(),
      "4": dueDate
    }
  };
}

/**
 * Helper function to send rent expired notification
 */
export function buildRentExpiredNotification({ name, roomNumber, expiryDate }) {
  return {
    contentSid: TEMPLATE_SIDS.RENT_EXPIRED,
    contentVariables: {
      "1": name,
      "2": roomNumber,
      "3": expiryDate
    }
  };
}

/**
 * Helper function to send recurring charge due reminder
 */
export function buildRecurringChargeDueReminder({ name, roomNumber, chargeDescription, amount, dueDate }) {
  return {
    contentSid: TEMPLATE_SIDS.RECURRING_CHARGE_DUE,
    contentVariables: {
      "1": name,
      "2": roomNumber,
      "3": chargeDescription,
      "4": amount.toLocaleString(),
      "5": dueDate
    }
  };
}

/**
 * Helper function to send payment confirmation
 */
export function buildPaymentConfirmation({ name, amount, paymentType, paymentDate, newExpiryDate }) {
  return {
    contentSid: TEMPLATE_SIDS.PAYMENT_CONFIRMED,
    contentVariables: {
      "1": name,
      "2": amount.toLocaleString(),
      "3": paymentType,
      "4": paymentDate,
      "5": newExpiryDate
    }
  };
}

/**
 * Helper function to send welcome to new tenant
 */
export function buildWelcomeNewTenant({ name, roomNumber }) {
  return {
    contentSid: TEMPLATE_SIDS.WELCOME_NEW_TENANT,
    contentVariables: {
      "1": name,
      "2": roomNumber
    }
  };
}

/**
 * Helper function to send welcome to applicant
 */
export function buildWelcomeApplicant({ name, applicationId }) {
  return {
    contentSid: TEMPLATE_SIDS.WELCOME_APPLICANT,
    contentVariables: {
      "1": name,
      "2": applicationId
    }
  };
}

/**
 * Helper function to send application approved
 */
export function buildApplicationApproved({ name }) {
  return {
    contentSid: TEMPLATE_SIDS.APPLICATION_APPROVED,
    contentVariables: {
      "1": name
    }
  };
}

/**
 * Helper function to send inspection confirmed
 */
export function buildInspectionConfirmed({ name, roomNumber, blockName, inspectionDate, inspectionTime, feeMessage }) {
  return {
    contentSid: TEMPLATE_SIDS.INSPECTION_CONFIRMED,
    contentVariables: {
      "1": name,
      "2": roomNumber,
      "3": blockName,
      "4": inspectionDate,
      "5": inspectionTime,
      "6": feeMessage
    }
  };
}

/**
 * Helper function to send inspection reminder
 */
export function buildInspectionReminder({ name, roomNumber, inspectionDate, inspectionTime, location }) {
  return {
    contentSid: TEMPLATE_SIDS.INSPECTION_REMINDER,
    contentVariables: {
      "1": name,
      "2": roomNumber,
      "3": inspectionDate,
      "4": inspectionTime,
      "5": location
    }
  };
}

/**
 * Helper function to send maintenance assignment to provider
 */
export function buildMaintenanceAssigned({ providerName, roomNumber, issueTitle, priority }) {
  return {
    contentSid: TEMPLATE_SIDS.MAINTENANCE_ASSIGNED,
    contentVariables: {
      "1": providerName,
      "2": roomNumber,
      "3": issueTitle,
      "4": priority
    }
  };
}

/**
 * Helper function to send registration incomplete reminder
 */
export function buildRegistrationIncomplete({ name, resumeUrl }) {
  return {
    contentSid: TEMPLATE_SIDS.REGISTRATION_INCOMPLETE,
    contentVariables: {
      "1": name,
      "2": resumeUrl
    }
  };
}

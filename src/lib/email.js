import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "ethereal.user@ethereal.email";
const smtpPass = process.env.SMTP_PASS || "ethereal_password";

// Single shared factory — port is always a Number, secure is correct for 465 (SSL) vs 587 (TLS)
function createTransporter() {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export async function sendInspectionReceipt({ email, name, date, reference, isFree, amount }) {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Your Booking Receipt - Covenant Hostel Tour",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Inspection Booked</h2>
          <p>Hi ${name},</p>
          <p>Thank you for booking an inspection to visit Covenant Hostel.</p>
          <div style="background: #f4f7fb; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Inspection Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
            ${isFree ? `<p></p>` : `<p><strong>Payment Reference:</strong> ${reference}</p>`}
          <p><strong>Be on the Lookout, We will notify you when the booking is confirmed.</strong></p>
            </div>
          <p>If you have any questions, feel free to contact us.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    if (smtpHost === "smtp.ethereal.email") {
      console.log("Sent via Ethereal. Preview: %s", nodemailer.getTestMessageUrl(info));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending inspection receipt:", error);
    return { success: false, error };
  }
}

export async function sendGuestInspectionConfirmation({ email, name, date, roomNumber, blockName, address, amount }) {
  try {
    const transporter = createTransporter();
    const roomInfo = roomNumber
      ? `<p><strong>Room:</strong> Room ${roomNumber}${blockName ? ` · ${blockName}` : ""}</p>${address ? `<p><strong>Address:</strong> ${address}</p>` : ""}`
      : "";
    const info = await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Inspection Booking Confirmed - Covenant Hostel",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b69ff;">Inspection Booking Confirmed!</h2>
          <p>Hi ${name},</p>
          <p>Your inspection booking has been confirmed. We look forward to showing you around!</p>
          <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0b69ff;">
            <h3 style="margin: 0 0 12px; color: #102a43;">Booking Details:</h3>
            <p style="margin: 8px 0;"><strong>Inspection Date:</strong> ${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            ${roomInfo}
            <p style="margin: 8px 0;"><strong>Amount Paid:</strong> ${amount === 0 ? "FREE" : `₦${Number(amount).toLocaleString()}`}</p>
          </div>
          <p>Please arrive on time for your scheduled inspection. If you need to reschedule or have any questions, feel free to contact us.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    if (smtpHost === "smtp.ethereal.email") {
      console.log("Guest inspection email preview: %s", nodemailer.getTestMessageUrl(info));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending guest inspection confirmation:", error);
    return { success: false, error };
  }
}

export async function sendLandlordInspectionAlert({ name, email, phone, date, roomNumber, blockName, address, amount }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set — skipping landlord notification.");
    return;
  }
  try {
    const transporter = createTransporter();
    const roomInfo = roomNumber ? `
      <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Room</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Room ${roomNumber}${blockName ? ` · ${blockName}` : ""}</td></tr>
      ${address ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Address</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${address}</td></tr>` : ""}
    ` : "";
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `New Inspection Booked — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #f4f7fb; padding: 30px; border-radius: 12px;">
          <div style="background: #0b69ff; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0;">New Inspection Booking</h2>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">A guest has booked an inspection tour.</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Guest Name</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${name}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${email}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Phone</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${phone || 'N/A'}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Inspection Date</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0b69ff;">${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
              ${roomInfo}
              <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Amount Paid</td><td style="padding: 10px 0; font-weight: bold; color: #16a34a;">${amount === 0 ? "FREE" : `₦${Number(amount).toLocaleString()}`}</td></tr>
            </table>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">Covenant Hostel Management System</p>
        </div>
      `,
    });
    console.log(`Landlord inspection notification sent to ${adminEmail}`);
  } catch (error) {
    console.error("Error sending landlord inspection notification:", error);
  }
}

export async function sendApplicationReceivedEmail({ email, name }) {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Application Received - Covenant Hostel",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Application Received</h2>
          <p>Hi ${name},</p>
          <p>Thank you for applying to Covenant Hostel. Your registration details and guarantor information have been received and are currently being reviewed by our team.</p>
          <p>Once your application is approved, we will send you another email with a link to set your password and activate your account.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    console.log(`Application Received email sent to ${email}. MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending application received email:", error);
    return { success: false, error };
  }
}

export async function sendAccountApprovedEmail({ email, name, setupLink }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Account Approved - Covenant Hostel",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #2563eb;">Your Account has been Approved!</h2>
          <p>Hi ${name},</p>
          <p>Great news! Your application for Covenant Hostel has been reviewed and approved.</p>
          <p>To finalize your registration and start using the portal, please click the button below to set your password and activate your account:</p>
          <div style="margin: 30px 0;">
            <a href="${setupLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Set My Password</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">This link will expire in 48 hours for security purposes.</p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #2563eb;">${setupLink}</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending account approved email:", error);
    return { success: false, error };
  }
}

export async function sendAccountRejectedEmail({ email, name, reason }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Update Regarding Your Application - Covenant Hostel",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Application Status Update</h2>
          <p>Hi ${name},</p>
          <p>Thank you for your interest in Covenant Hostel. After reviewing your application, we regret to inform you that we are unable to approve your request at this time.</p>
          <div style="margin: 24px 0; padding: 20px; background: #fff1f2; border-radius: 10px; border-left: 4px solid #e11d48;">
            <p style="margin: 0; font-weight: bold; color: #9f1239; font-size: 14px;">Reason for rejection:</p>
            <p style="margin: 8px 0 0; color: #b91c1c; font-size: 15px; line-height: 1.5;">${reason || "Your application did not meet our current requirements."}</p>
          </div>
          <p>If you have any questions or would like to re-apply in the future with updated information, please feel free to reach out.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending account rejected email:", error);
    return { success: false, error };
  }
}

export async function sendRentExpiryReminder({ email, name, roomNumber, expiryDate, daysLeft }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `Rent Expiry Reminder - Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Rent Expiry Notification</h2>
          <p>Hi ${name},</p>
          <p>This is a friendly reminder that your rent for <strong>Room ${roomNumber}</strong> is set to expire in <strong>${daysLeft} days</strong> (${new Date(expiryDate).toLocaleDateString()}).</p>
          <p>Please ensure you make the necessary arrangements for renewal to maintain your occupancy.</p>
          <div style="margin: 25px 0; padding: 15px; background: #fff1f2; border-radius: 8px; border-left: 4px solid #e11d48;">
            <p style="margin: 0; font-weight: bold; color: #9f1239;">Action Required: Renewal payment should be made before the expiry date.</p>
          </div>
          <p>If you have already made a payment, please disregard this message or contact management to confirm your status.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending rent expiry reminder:", error);
    return { success: false, error };
  }
}

export async function sendAdminRentSummary({ expiries }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || expiries.length === 0) return;
  try {
    const transporter = createTransporter();
    const expiryListHtml = expiries.map(item => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-weight: bold;">Room ${item.roomNumber}</td>
        <td style="padding: 10px;">${item.tenantName}</td>
        <td style="padding: 10px; color: #e11d48;">${new Date(item.expiryDate).toLocaleDateString()}</td>
      </tr>
    `).join('');
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `Daily Rent Expiry Summary - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h3>Daily Rent Expiry Summary</h3>
          <p>The following units have rent expiring soon:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #f8fafc; text-align: left;">
                <th style="padding: 10px;">Room</th>
                <th style="padding: 10px;">Tenant</th>
                <th style="padding: 10px;">Expiry Date</th>
              </tr>
            </thead>
            <tbody>${expiryListHtml}</tbody>
          </table>
          <p style="margin-top: 25px; color: #64748b; font-size: 12px;">This is an automated system notification.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending admin rent summary:", error);
    return { success: false, error };
  }
}

export async function sendPartialPaymentDueReminder({ email, name, roomNumber, dueDate, amount, installmentNumber, totalInstallments }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `Installment ${installmentNumber}/${totalInstallments} Due — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b69ff;">Installment Payment Reminder</h2>
          <p>Hi ${name},</p>
          <p>This is a reminder that installment <strong>${installmentNumber} of ${totalInstallments}</strong> for your rent on <strong>Room ${roomNumber}</strong> is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
          <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0b69ff;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #102a43;">Amount Due: ₦${Number(amount).toLocaleString()}</p>
          </div>
          <p>Please log in to your tenant portal to make your payment before the due date.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending partial payment reminder:", error);
    return { success: false, error };
  }
}

export async function sendAdminPartialPaymentAlert({ adminEmail, tenantName, roomNumber, amount, installmentNumber, totalInstallments, dueDate }) {
  if (!adminEmail) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `Installment Due: ${tenantName} — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h3>Upcoming Installment Payment</h3>
          <p>Tenant <strong>${tenantName}</strong> (Room ${roomNumber}) has installment <strong>${installmentNumber}/${totalInstallments}</strong> due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
          <p>Amount: <strong>₦${Number(amount).toLocaleString()}</strong></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending admin partial payment alert:", error);
    return { success: false, error };
  }
}

export async function sendReceiptUploadedAlert({ adminEmail, tenantName, roomNumber, amount, receiptUrl }) {
  if (!adminEmail) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `Receipt Uploaded — ${tenantName} (Room ${roomNumber})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h3 style="color: #0b69ff;">Payment Receipt Uploaded</h3>
          <p><strong>${tenantName}</strong> (Room ${roomNumber}) has uploaded a payment receipt of <strong>₦${Number(amount).toLocaleString()}</strong> awaiting your approval.</p>
          ${receiptUrl ? `<p><a href="${receiptUrl}" style="color: #0b69ff;">View Receipt</a></p>` : ""}
          <p>Please log in to the landlord portal to approve or reject this payment.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending receipt uploaded alert:", error);
    return { success: false, error };
  }
}

export async function sendRecurringChargeDueReminder({ email, name, roomNumber, chargeTitle, amount, dueDate }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `Charge Due: ${chargeTitle} — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b69ff;">Recurring Charge Due</h2>
          <p>Hi ${name},</p>
          <p>A recurring charge for your tenancy on <strong>Room ${roomNumber}</strong> is due on <strong>${new Date(dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
          <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0b69ff;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: bold;">Charge</p>
            <p style="margin: 0 0 12px; font-size: 16px; font-weight: bold; color: #102a43;">${chargeTitle}</p>
            <p style="margin: 0; font-size: 22px; font-weight: 900; color: #0b69ff;">₦${Number(amount).toLocaleString()}</p>
          </div>
          <p>Please log in to your tenant portal to make your payment before the due date.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending recurring charge reminder:", error);
    return { success: false, error };
  }
}

export async function sendAdminRecurringChargeAlert({ adminEmail, tenantName, roomNumber, chargeTitle, amount, dueDate }) {
  if (!adminEmail) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `Recurring Charge Due: ${tenantName} — ${chargeTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h3>Recurring Charge Due</h3>
          <p>Tenant <strong>${tenantName}</strong> (Room ${roomNumber}) has a recurring charge <strong>${chargeTitle}</strong> of <strong>₦${Number(amount).toLocaleString()}</strong> due on <strong>${new Date(dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending admin recurring charge alert:", error);
    return { success: false, error };
  }
}

export async function sendRentExpiredNotification({ email, name, roomNumber, expiryDate }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `Your Tenancy Has Expired — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Tenancy Expired</h2>
          <p>Hi ${name},</p>
          <p>Your tenancy for <strong>Room ${roomNumber}</strong> expired on <strong>${new Date(expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
          <div style="background: #fff1f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #e11d48;">
            <p style="margin: 0; font-weight: bold; color: #9f1239;">Your portal access has been restricted.</p>
            <p style="margin: 8px 0 0; color: #b91c1c; font-size: 14px;">Please Login in to Pay or contact the hostel management office to renew your tenancy and restore full access.</p>
          </div>
          <p>If you believe this is an error or have already made a renewal payment, please contact us immediately.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
          <p>08090791947</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending rent expired notification:", error);
    return { success: false, error };
  }
}

export async function sendPaymentReceiptEmail({
  email,
  name,
  amount,
  reference,
  paymentDate,
  roomNumber,
  blockName,
  roomAddress,
  breakdown,
  paymentType,
}) {
  try {
    const transporter = createTransporter();

    const formattedDate = new Date(paymentDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Build breakdown table rows if multiple items
    const hasBreakdown = Array.isArray(breakdown) && breakdown.length > 1;
    const breakdownHtml = hasBreakdown
      ? `
        <div style="margin: 20px 0;">
          <p style="margin: 0 0 10px; font-weight: bold; color: #102a43; font-size: 14px;">Payment Breakdown:</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f0f7ff;">
                <th style="padding: 10px 12px; text-align: left; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Description</th>
                <th style="padding: 10px 12px; text-align: right; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${breakdown
                .map(
                  (item, i) => `
                <tr style="background: ${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155;">${item.name}</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #334155;">₦${Number(item.amount).toLocaleString()}</td>
                </tr>`
                )
                .join("")}
              <tr style="background: #f0f7ff;">
                <td style="padding: 12px; font-weight: bold; color: #102a43; border-top: 2px solid #e2e8f0;">Total</td>
                <td style="padding: 12px; font-weight: bold; color: #0b69ff; text-align: right; border-top: 2px solid #e2e8f0;">₦${Number(amount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>`
      : "";

    const paymentTypeLabel =
      paymentType === "PARTIAL"
        ? "Partial / Installment Payment"
        : paymentType === "RECURRING"
        ? "Utility / Recurring Charge"
        : "Full Rent Payment";

    const info = await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `Payment Receipt — ₦${Number(amount).toLocaleString()} Confirmed`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0b69ff 0%, #1e40af 100%); color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0 0 4px; font-size: 22px;">Payment Confirmed ✓</h2>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">Covenant Hostel Management</p>
          </div>

          <p style="color: #334155; font-size: 15px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            Your payment has been received and confirmed. Please keep this email as your official receipt.
          </p>

          <!-- Payment Summary Card -->
          <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0b69ff;">
            <h3 style="margin: 0 0 16px; color: #102a43; font-size: 16px;">Payment Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 45%;">Amount Paid</td>
                <td style="padding: 8px 0; font-weight: bold; color: #0b69ff; font-size: 20px;">₦${Number(amount).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Payment Type</td>
                <td style="padding: 8px 0; font-weight: 600; color: #334155;">${paymentTypeLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date</td>
                <td style="padding: 8px 0; color: #334155;">${formattedDate}</td>
              </tr>
              ${reference ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Reference</td>
                <td style="padding: 8px 0; color: #334155; font-family: monospace; font-size: 13px;">${reference}</td>
              </tr>` : ""}
            </table>
          </div>

          <!-- Room Details Card -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 16px; color: #102a43; font-size: 16px;">Room Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              ${blockName ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 45%;">Block / Building</td>
                <td style="padding: 8px 0; font-weight: 600; color: #334155;">${blockName}</td>
              </tr>` : ""}
              ${roomNumber ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Room Number</td>
                <td style="padding: 8px 0; font-weight: 600; color: #334155;">Room ${roomNumber}</td>
              </tr>` : ""}
              ${roomAddress ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Address</td>
                <td style="padding: 8px 0; color: #334155;">${roomAddress}</td>
              </tr>` : ""}
            </table>
          </div>

          <!-- Breakdown (only shown when multiple items) -->
          ${breakdownHtml}

          <!-- Thank You -->
          <div style="margin: 28px 0 16px; padding: 20px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #15803d;">Thank you for your payment! 🎉</p>
            <p style="margin: 8px 0 0; font-size: 13px; color: #166534;">We appreciate your promptness. If you have any questions, please contact the hostel management office.</p>
          </div>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            This is an automated receipt from Covenant Hostel Management System.<br/>
            Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (smtpHost === "smtp.ethereal.email") {
      console.log("Payment receipt email preview: %s", nodemailer.getTestMessageUrl(info));
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending payment receipt email:", error);
    return { success: false, error };
  }
}

export async function sendPaymentRejectedEmail({ email, name, amount, reason }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  try {
    const transporter = createTransporter();
    
    // Email to tenant
    const tenantInfo = await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: "Payment Receipt Rejected - Covenant Hostel",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Payment Receipt Rejected</h2>
          <p>Hi ${name},</p>
          <p>Your payment receipt of <strong>₦${amount.toLocaleString()}</strong> has been rejected by management.</p>
          ${reason ? `
          <div style="margin: 24px 0; padding: 20px; background: #fff1f2; border-radius: 10px; border-left: 4px solid #e11d48;">
            <p style="margin: 0; font-weight: bold; color: #9f1239; font-size: 14px;">Reason for rejection:</p>
            <p style="margin: 8px 0 0; color: #b91c1c; font-size: 15px; line-height: 1.5;">${reason}</p>
          </div>
          ` : ""}
          <p>Please log in to your portal to upload a valid payment receipt or contact the hostel management office.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });

    if (smtpHost === "smtp.ethereal.email") {
      console.log("Tenant payment rejection email preview: %s", nodemailer.getTestMessageUrl(tenantInfo));
    }

    // Email to admin if configured
    if (adminEmail) {
      const adminInfo = await transporter.sendMail({
        from: `"Covenant Hostel" <${smtpUser}>`,
        to: adminEmail,
        subject: `Rejected Payment Alert — Tenant: ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h3 style="color: #e11d48;">Payment Receipt Rejected</h3>
            <p>You have rejected the payment receipt uploaded by <strong>${name}</strong>.</p>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            ${reason ? `<p><strong>Reason Provided:</strong> ${reason}</p>` : ""}
            <p>An automated notification and email has been sent to the tenant to upload a new receipt.</p>
          </div>
        `,
      });
      if (smtpHost === "smtp.ethereal.email") {
        console.log("Admin payment rejection email preview: %s", nodemailer.getTestMessageUrl(adminInfo));
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending payment rejected email:", error);
    return { success: false, error };
  }
}

export async function sendPartialPaymentOverdueAlert({ email, name, roomNumber, dueDate, amount, installmentNumber, totalInstallments }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `OVERDUE: Installment ${installmentNumber}/${totalInstallments} — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Installment Payment Overdue</h2>
          <p>Hi ${name},</p>
          <p>This is a notification that installment <strong>${installmentNumber} of ${totalInstallments}</strong> for your rent on <strong>Room ${roomNumber}</strong> is now <strong>OVERDUE</strong>. It was due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
          <div style="background: #fff1f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #e11d48;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #9f1239;">Amount Due: ₦${Number(amount).toLocaleString()}</p>
          </div>
          <p>Please log in to your tenant portal immediately to make your payment and avoid any penalties.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending partial payment overdue alert:", error);
    return { success: false, error };
  }
}

export async function sendAdminPartialPaymentOverdueAlert({ adminEmail, tenantName, roomNumber, amount, installmentNumber, totalInstallments, dueDate }) {
  if (!adminEmail) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `OVERDUE Installment: ${tenantName} — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h3 style="color: #e11d48;">Overdue Installment Payment</h3>
          <p>Tenant <strong>${tenantName}</strong> (Room ${roomNumber}) has an overdue installment <strong>${installmentNumber}/${totalInstallments}</strong> which was due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
          <p>Amount: <strong>₦${Number(amount).toLocaleString()}</strong></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending admin partial payment overdue alert:", error);
    return { success: false, error };
  }
}

export async function sendRecurringChargeOverdueAlert({ email, name, roomNumber, chargeTitle, amount, dueDate }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `OVERDUE Charge: ${chargeTitle} — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Recurring Charge Overdue</h2>
          <p>Hi ${name},</p>
          <p>This is a notification that your recurring charge for <strong>Room ${roomNumber}</strong> is now <strong>OVERDUE</strong>. It was due on <strong>${new Date(dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
          <div style="background: #fff1f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #e11d48;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #9f1239; text-transform: uppercase; font-weight: bold;">Charge</p>
            <p style="margin: 0 0 12px; font-size: 16px; font-weight: bold; color: #9f1239;">${chargeTitle}</p>
            <p style="margin: 0; font-size: 22px; font-weight: 900; color: #e11d48;">₦${Number(amount).toLocaleString()}</p>
          </div>
          <p>Please log in to your tenant portal immediately to make your payment and avoid any penalties.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending recurring charge overdue alert:", error);
    return { success: false, error };
  }
}

export async function sendAdminRecurringChargeOverdueAlert({ adminEmail, tenantName, roomNumber, chargeTitle, amount, dueDate }) {
  if (!adminEmail) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: adminEmail,
      subject: `OVERDUE Recurring Charge: ${tenantName} — ${chargeTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h3 style="color: #e11d48;">Overdue Recurring Charge</h3>
          <p>Tenant <strong>${tenantName}</strong> (Room ${roomNumber}) has an overdue recurring charge <strong>${chargeTitle}</strong> of <strong>₦${Number(amount).toLocaleString()}</strong> which was due on <strong>${new Date(dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending admin recurring charge overdue alert:", error);
    return { success: false, error };
  }
}

export async function sendTenantInspectionScheduledEmail({ email, name, roomNumber, date, notes }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `Room Inspection Scheduled — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b69ff;">Room Inspection Scheduled</h2>
          <p>Hi ${name},</p>
          <p>This is a notification that the hostel management has scheduled an inspection for <strong>Room ${roomNumber}</strong>.</p>
          <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0b69ff;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #102a43;">Inspection Date:</p>
            <p style="margin: 0 0 12px; font-size: 16px; color: #0b69ff;">${new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            ${notes ? `
            <p style="margin: 0 0 8px; font-weight: bold; color: #102a43;">Notes:</p>
            <p style="margin: 0; font-size: 14px; color: #334155;">${notes}</p>
            ` : ""}
          </div>
          <p>Please ensure you are available during the inspection, or contact the hostel management if you have any questions or need to reschedule.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending tenant inspection scheduled email:", error);
    return { success: false, error };
  }
}

export async function sendProviderAssignedEmail({ email, name, roomNumber, issue, description, priority }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `New Task Assigned — Room ${roomNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b69ff;">New Maintenance Task</h2>
          <p>Hi ${name},</p>
          <p>You have been assigned a new maintenance ticket by the landlord.</p>
          <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0b69ff;">
            <p><strong>Room:</strong> ${roomNumber}</p>
            <p><strong>Issue:</strong> ${issue}</p>
            <p><strong>Priority:</strong> ${priority}</p>
            <p><strong>Description:</strong> ${description || "No description provided."}</p>
          </div>
          <p>Please log in to your dashboard to contact the tenant and resolve the issue.</p>
          <p>Best regards,<br/>Covenant Hostel Management</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending provider assigned email:", error);
    return { success: false, error };
  }
}

export async function sendTenantProviderAssignedEmail({ email, name, providerName, specialty, roomNumber, issue }) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Covenant Hostel" <${smtpUser}>`,
      to: email,
      subject: `Service Provider Assigned to your request`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0b69ff;">Help is on the way!</h2>
          <p>Hi ${name},</p>
          <p>A service provider has been assigned to your maintenance request for <strong>Room ${roomNumber}</strong>.</p>
          <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0b69ff;">
            <p><strong>Issue:</strong> ${issue}</p>
            <p><strong>Provider Name:</strong> ${providerName}</p>
            <p><strong>Specialty:</strong> ${specialty}</p>
          </div>
          <p>The provider will reach out to you shortly or arrive at your room to assess the situation.</p>
          <p>Best regards,<br/>Covenant Hostel Management</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending tenant provider assigned email:", error);
    return { success: false, error };
  }
}

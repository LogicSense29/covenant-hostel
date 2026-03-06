import nodemailer from "nodemailer";

// NOTE: Uses ethereal for testing. Add real SMTP details to .env for production.
const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
const smtpPort = process.env.SMTP_PORT || 587;
const smtpUser = process.env.SMTP_USER || "ethereal.user@ethereal.email"; // Replace in env
const smtpPass = process.env.SMTP_PASS || "ethereal_password"; // Replace in env

export async function sendInspectionReceipt({ email, name, date, reference, amount }) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });


    const info = await transporter.sendMail({
      from: '"Covenant Hostel" <support@covenanthostel.com>',
      to: email,
      subject: "Your Booking Receipt - Covenant Hostel Tour",
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: auto;">
          <h2>Tour Booking Confirmed</h2>
          <p>Hi ${name},</p>
          <p>Thank you for booking a tour to visit Covenant Hostel. We have successfully received your payment.</p>
          
          <div style="background: #f4f7fb; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Inspection Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Payment Reference:</strong> ${reference}</p>
          </div>
          
          <p>If you have any questions, feel free to contact us.</p>
          <p>Best regards,<br/>The Covenant Hostel Management Team</p>
        </div>
      `,
    });

    if (smtpHost === "smtp.ethereal.email") {
      console.log("-----------------------------------------");
      console.log("Sent via Ethereal. Preview: %s", nodemailer.getTestMessageUrl(info));
      console.log("-----------------------------------------");
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendAdminInspectionAlert({ name, email, phone, date, reference, amount }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set — skipping admin notification.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: '"Covenant Hostel" <support@covenanthostel.com>',
      to: adminEmail,
      subject: `New Inspection Booked — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #f4f7fb; padding: 30px; border-radius: 12px;">
          <div style="background: #1e3a5f; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0;">New Inspection Booking</h2>
            <p style="margin: 4px 0 0; opacity: 0.7; font-size: 14px;">A guest has paid for an inspection tour.</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Guest Name</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${name}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${email}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Phone</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${phone || 'N/A'}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Inspection Date</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #2563eb;">${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Amount Paid</td><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #16a34a;">&#8358;${Number(amount).toLocaleString()}</td></tr>
              <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Payment Ref</td><td style="padding: 10px 0; font-weight: bold; font-family: monospace;">${reference}</td></tr>
            </table>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">Covenant Hostel Management System</p>
        </div>
      `,
    });

    console.log(`Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.error("Error sending admin notification email:", error);
  }
}


export async function sendApplicationReceivedEmail({ email, name }) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: '"Covenant Hostel" <support@covenanthostel.com>',
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
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpHost == 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: '"Covenant Hostel" <support@covenanthostel.com>',
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

export async function sendRentExpiryReminder({ email, name, roomNumber, expiryDate, daysLeft }) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: '"Covenant Hostel" <support@covenanthostel.com>',
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
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const expiryListHtml = expiries.map(item => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-weight: bold;">Room ${item.roomNumber}</td>
        <td style="padding: 10px;">${item.tenantName}</td>
        <td style="padding: 10px; color: #e11d48;">${new Date(item.expiryDate).toLocaleDateString()}</td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: '"Covenant Hostel" <support@covenanthostel.com>',
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
            <tbody>
              ${expiryListHtml}
            </tbody>
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

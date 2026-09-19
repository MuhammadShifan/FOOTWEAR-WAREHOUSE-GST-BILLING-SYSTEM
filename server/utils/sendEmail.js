import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer Transporter
 */
const createTransporter = () => {
  // If dedicated service specified (e.g. 'gmail')
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
      },
    });
  }

  // Standard SMTP Configuration
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

/**
 * Send 6-Digit OTP Email securely via Nodemailer
 * @param {Object} options - { email, subject, message, html, otp }
 */
export const sendEmail = async (options) => {
  const hasSmtpConfig =
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.EMAIL_USER && process.env.EMAIL_PASS);

  // If running in development without SMTP credentials, log to server terminal only
  if (!hasSmtpConfig) {
    console.warn('=========================================================');
    console.warn('[NODEMAILER WARNING] SMTP credentials not detected in .env');
    console.warn(`Recipient: ${options.email}`);
    console.warn(`Subject: ${options.subject}`);
    if (options.otp) {
      console.warn(`OTP Generated (Server Log Only): ${options.otp}`);
    }
    console.warn('To deliver real emails, add EMAIL_USER & EMAIL_PASS to server/.env');
    console.warn('=========================================================');
    return {
      success: true,
      mode: 'dev_terminal',
      message: 'SMTP credentials missing. Logged to server terminal only.',
    };
  }

  const transporter = createTransporter();

  // Branded HTML Email Template
  const emailHtml =
    options.html ||
    `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 8px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      <div style="background-color: #1e293b; padding: 24px; border-bottom: 1px solid #334155; text-align: center;">
        <h2 style="margin: 0; color: #38bdf8; font-size: 20px; letter-spacing: 1px; font-family: monospace;">[ AS MARKETING ]</h2>
        <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Footwear Warehouse & Billing Management System</p>
      </div>
      <div style="padding: 32px 24px; background-color: #0f172a;">
        <h3 style="margin-top: 0; color: #f8fafc; font-size: 18px; font-weight: 600;">Password Reset Request</h3>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0 20px;">
          You requested a password reset for your warehouse account. Use the 6-digit One-Time Password (OTP) below to authenticate your request:
        </p>
        
        <div style="background-color: #182234; border: 1.5px dashed #38bdf8; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 12px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">Your Verification Code</div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #38bdf8;">
            ${options.otp || '000000'}
          </div>
        </div>

        <div style="background-color: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
          <p style="color: #fbbf24; font-size: 13px; margin: 0; font-weight: 500;">
            &#9888; Security Notice: This code will expire in <strong>10 minutes</strong>. Do not share this OTP with anyone.
          </p>
        </div>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; line-height: 1.5;">
          If you did not request this password reset, please ignore this email or notify your system administrator immediately.
        </p>
      </div>
    </div>
  `;

  const senderAddress =
    process.env.SMTP_FROM ||
    `"AS Marketing Security" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;

  const mailOptions = {
    from: senderAddress,
    to: options.email,
    subject: options.subject || 'Password Reset Verification Code - AS MARKETING',
    text: options.message || `Your 6-digit password reset OTP is ${options.otp}. It is valid for 10 minutes.`,
    html: emailHtml,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[NODEMAILER SUCCESS] OTP Email dispatched to ${options.email} (Message ID: ${info.messageId})`);
  return { success: true, messageId: info.messageId };
};

export default sendEmail;

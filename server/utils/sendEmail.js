import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer Transporter
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      'Email credentials missing. Please set EMAIL_USER and EMAIL_PASS in your server/.env file.'
    );
  }

  // If using Gmail or EMAIL_SERVICE is specified
  const service = process.env.EMAIL_SERVICE || (user.includes('@gmail.com') ? 'gmail' : undefined);

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false, // Prevents certificate issues in local/cloud environments
      },
    });
  }

  // Custom SMTP Server configuration
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send 6-Digit OTP Email securely via Nodemailer
 * @param {Object} options - { email, subject, message, html, otp }
 */
export const sendEmail = async (options) => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('=========================================================');
    console.error('[EMAIL ERROR] SMTP credentials missing in server/.env');
    console.error('To send real emails to inboxes, add:');
    console.error('EMAIL_USER=yourwarehouse@gmail.com');
    console.error('EMAIL_PASS=your_16_character_google_app_password');
    console.error('=========================================================');
    throw new Error(
      'Email service not configured. Please set EMAIL_USER and EMAIL_PASS in server/.env.'
    );
  }

  const transporter = createTransporter();

  // Branded HTML Email Template
  const emailHtml =
    options.html ||
    `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="background-color: #1e293b; padding: 24px; border-bottom: 1px solid #334155; text-align: center;">
          <h2 style="margin: 0; color: #38bdf8; font-size: 20px; letter-spacing: 1px; font-family: monospace;">[ AS MARKETING ]</h2>
          <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Footwear Warehouse & Billing Management System</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px;">
          <h3 style="margin-top: 0; color: #f8fafc; font-size: 18px; font-weight: 600;">Password Reset Verification</h3>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0 20px;">
            We received a request to reset the password for your account. Please use the 6-digit One-Time Password (OTP) below to authenticate:
          </p>
          
          <!-- OTP Box -->
          <div style="background-color: #182234; border: 1.5px dashed #38bdf8; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">Your 6-Digit OTP Code</div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #38bdf8; padding-left: 12px;">
              ${options.otp || '000000'}
            </div>
          </div>

          <!-- Alert -->
          <div style="background-color: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #fbbf24; font-size: 13px; margin: 0; font-weight: 500;">
              &#9888; This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; line-height: 1.5;">
            If you did not request this password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const senderAddress =
    process.env.SMTP_FROM ||
    `"AS MARKETING Security" <${user}>`;

  const mailOptions = {
    from: senderAddress,
    to: options.email,
    subject: options.subject || `AS MARKETING - ${options.otp} is your verification code`,
    text: options.message || `Your 6-digit password reset OTP is ${options.otp}. It is valid for 10 minutes.`,
    html: emailHtml,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[NODEMAILER SUCCESS] OTP Email dispatched to ${options.email} (Message ID: ${info.messageId})`);
  return { success: true, messageId: info.messageId };
};

export default sendEmail;

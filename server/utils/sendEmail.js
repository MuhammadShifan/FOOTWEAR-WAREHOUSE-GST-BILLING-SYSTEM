import nodemailer from 'nodemailer';

/**
 * Send Email helper using Nodemailer
 * @param {Object} options - { email, subject, message, html, otp }
 */
export const sendEmail = async (options) => {
  const hasSmtpConfig =
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.EMAIL_USER && process.env.EMAIL_PASS);

  if (!hasSmtpConfig) {
    console.log('---------------------------------------------------------');
    console.log(` [EMAIL DEV MODE] SMTP credentials not set in .env`);
    console.log(` To: ${options.email}`);
    console.log(` Subject: ${options.subject}`);
    if (options.otp) {
      console.log(` >>> 6-DIGIT OTP: ${options.otp} (Valid for 10 minutes) <<<`);
    }
    console.log('---------------------------------------------------------');
    return {
      success: true,
      mode: 'dev_console',
      message: 'Email logged to server console (SMTP not configured)',
    };
  }

  // Create reusable transporter object using the default SMTP transport
  let transporter;
  if (process.env.EMAIL_SERVICE) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }

  const defaultHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 8px; border: 1px solid #334155; overflow: hidden;">
      <div style="background-color: #1e293b; padding: 24px; border-bottom: 1px solid #334155; text-align: center;">
        <h2 style="margin: 0; color: #38bdf8; font-size: 20px; letter-spacing: 1px;">[ AS MARKETING ]</h2>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Footwear Warehouse & Billing System</p>
      </div>
      <div style="padding: 28px 24px;">
        <h3 style="margin-top: 0; color: #f8fafc; font-size: 18px;">Password Reset Request</h3>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Use the 6-digit One-Time Password (OTP) below to verify your identity and complete the reset:
        </p>
        <div style="background-color: #182234; border: 1px dashed #38bdf8; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Fira Code', monospace, Courier; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #38bdf8;">
            ${options.otp || '000000'}
          </span>
        </div>
        <p style="color: #fbbf24; font-size: 13px; margin: 12px 0;">
          &#9888; This OTP will expire in <strong>10 minutes</strong>.
        </p>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px; border-top: 1px solid #334155; padding-top: 14px;">
          If you did not request this password reset, please ignore this email or contact the warehouse administrator.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"AS Marketing Security" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@asmarketing.com'}>`,
    to: options.email,
    subject: options.subject || 'Password Reset Verification Code - AS MARKETING',
    text: options.message || `Your 6-digit password reset OTP is ${options.otp}. It is valid for 10 minutes.`,
    html: options.html || defaultHtml,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[EMAIL SENT] Message ID: ${info.messageId} to ${options.email}`);
  return { success: true, messageId: info.messageId };
};

export default sendEmail;

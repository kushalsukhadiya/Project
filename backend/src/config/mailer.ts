import nodemailer from 'nodemailer';

const isMailConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter: nodemailer.Transporter | null = null;

if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('Nodemailer SMTP configured.');
} else {
  console.log('SMTP credentials missing in env. Falling back to log-based notifications.');
}

export const sendNotificationEmail = async (
  to: string, 
  subject: string, 
  text: string, 
  html?: string
): Promise<void> => {
  if (isMailConfigured && transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ecocycle.com',
        to,
        subject,
        text,
        html: html || `<div style="font-family: sans-serif; padding: 20px;">${text}</div>`,
      });
      console.log(`[EMAIL SENT] to ${to}: ${subject}`);
      return;
    } catch (error) {
      console.error('[EMAIL ERROR] Failed to send email via SMTP:', error);
    }
  }

  // Log to console fallback
  console.log('\n--- [MOCK EMAIL NOTIFICATION] ---');
  console.log(`From: ${process.env.SMTP_FROM || 'noreply@ecocycle.com'}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text Body: ${text}`);
  console.log('---------------------------------\n');
};

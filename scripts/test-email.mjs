/**
 * Test script to verify SMTP email sending.
 * Run: node scripts/test-email.mjs
 * 
 * Requires env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * These can be set via .env file or inline:
 *   SMTP_HOST=smtp.mailersend.net SMTP_PORT=587 ... node scripts/test-email.mjs
 */
import nodemailer from "nodemailer";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const {
  SMTP_HOST = "smtp.mailersend.net",
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
} = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  console.error("\n❌ SMTP not configured. Please set these env vars:");
  console.error("   SMTP_HOST  (default: smtp.mailersend.net)");
  console.error("   SMTP_PORT  (default: 587)");
  console.error("   SMTP_USER  (required - your MailerSend SMTP username)");
  console.error("   SMTP_PASS  (required - your MailerSend SMTP password)\n");
  console.error("   Add them to your .env file or pass inline:\n");
  console.error("   SMTP_USER=... SMTP_PASS=... node scripts/test-email.mjs <test@example.com>\n");
  process.exit(1);
}

const testEmail = process.argv[2];
if (!testEmail) {
  console.error("\n❌ Please provide a recipient email address:");
  console.error("   node scripts/test-email.mjs your-email@example.com\n");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#0d9488;color:white;padding:30px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:24px">Test Email — RIC Booking System</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:30px">
    <p>This is a test email from the RIC Event Website booking system.</p>
    <p style="color:#6b7280">If you're seeing this, SMTP is working correctly for booking confirmations.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0">
      <p style="margin:4px 0"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p style="margin:4px 0"><strong>SMTP Host:</strong> ${SMTP_HOST}</p>
    </div>
  </div>
</div>`;

console.log(`\n📧 Sending test email to ${testEmail}...`);
console.log(`   SMTP: ${SMTP_USER} @ ${SMTP_HOST}:${SMTP_PORT}\n`);

try {
  const info = await transporter.sendMail({
    from: `"RIC Jaipur" <${SMTP_USER}>`,
    to: testEmail,
    subject: "Test Email - RIC Booking System",
    html,
  });
  console.log(`✅ Email sent successfully!`);
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Check your inbox at: ${testEmail}\n`);
} catch (error) {
  console.error(`❌ Failed to send email:`, error.message);
  console.error(`\nTroubleshooting tips:`);
  console.error(`  1. Verify your SMTP credentials are correct`);
  console.error(`  2. Make sure MailerSend has verified your sender domain/email`);
  console.error(`  3. Check that SMTP access is enabled in your MailerSend dashboard\n`);
  process.exit(1);
}

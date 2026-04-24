import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a reusable transporter using Gmail
// In production, you might want to use SendGrid, AWS SES, or Mailgun
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g., yourname@gmail.com
    pass: process.env.EMAIL_PASS  // e.g., your App Password from Google
  }
});

export async function sendResetEmail(toEmail, resetToken) {
  const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Password Reset Request - Security Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Click the secure button below to choose a new password.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Reset My Password
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px;">If you did not request a password reset, please safely ignore this email. Your account is secure.</p>
      </div>
    `
  };

  try {
    // Only attempt to send if credentials are provided in .env
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`[SECURE] Password reset link emailed to ${toEmail}`);
    } else {
      console.log(`[DEV MODE] Email credentials not set in .env. Here is the reset link:\n${resetLink}`);
    }
  } catch (error) {
    console.error('Error sending reset email:', error.message);
  }
}

import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter based on environment
const createTransporter = () => {
  // For development, use Ethereal (fake SMTP for testing)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('📧 Email service: Using console output (no SMTP configured)');
    return null;
  }

  // For production or when SMTP is configured
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 10000, // 10 seconds
    pool: true, // Use connection pooling
    maxConnections: 1,
    maxMessages: 3,
  });
};

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter lazily
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Generate a random token
export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// App name for emails
const APP_NAME = 'سجال | Sejal';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@sejal.app';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const transport = getTransporter();

  if (!transport) {
    // In development without SMTP, log the email
    console.log('═══════════════════════════════════════');
    console.log('📧 EMAIL (Development Mode)');
    console.log('═══════════════════════════════════════');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('───────────────────────────────────────');
    console.log(options.text || options.html.replace(/<[^>]*>/g, ''));
    console.log('═══════════════════════════════════════');
    return true;
  }

  try {
    await transport.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`✅ Email sent to: ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    
    // Log more details for debugging
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('📧 Email connection error. Check SMTP settings:');
      console.error(`   Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
      console.error(`   Port: ${process.env.SMTP_PORT || '587'}`);
      console.error(`   User: ${process.env.SMTP_USER ? 'Set ✓' : 'NOT SET ✗'}`);
      console.error(`   Password: ${process.env.SMTP_PASSWORD ? 'Set ✓' : 'NOT SET ✗'}`);
      console.error(`   Secure: ${process.env.SMTP_SECURE === 'true' ? 'Yes (TLS)' : 'No (STARTTLS)'}`);
    }
    
    return false;
  }
};

// Send verification email with code
export const sendVerificationEmail = async (
  email: string,
  code: string,
  displayName?: string
): Promise<boolean> => {
  const greeting = displayName ? `مرحباً ${displayName}` : 'مرحباً';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; font-size: 32px; color: #f59e0b; margin-bottom: 20px; }
        .code { background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .code-number { font-size: 36px; font-weight: bold; color: #b45309; letter-spacing: 8px; }
        .message { color: #374151; line-height: 1.8; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎮 ${APP_NAME}</div>
        <div class="message">
          <p>${greeting}،</p>
          <p>شكراً لتسجيلك في سجال! لتأكيد بريدك الإلكتروني، استخدم الرمز التالي:</p>
        </div>
        <div class="code">
          <div class="code-number">${code}</div>
        </div>
        <div class="message">
          <p>هذا الرمز صالح لمدة <strong>15 دقيقة</strong>.</p>
          <p>إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذه الرسالة.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${greeting}،

شكراً لتسجيلك في سجال!

رمز التحقق الخاص بك: ${code}

هذا الرمز صالح لمدة 15 دقيقة.

إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذه الرسالة.
  `;

  return sendEmail({
    to: email,
    subject: `${code} - رمز التحقق من ${APP_NAME}`,
    html,
    text,
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  code: string,
  displayName?: string
): Promise<boolean> => {
  const greeting = displayName ? `مرحباً ${displayName}` : 'مرحباً';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; font-size: 32px; color: #f59e0b; margin-bottom: 20px; }
        .code { background: #fee2e2; border: 2px dashed #ef4444; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .code-number { font-size: 36px; font-weight: bold; color: #b91c1c; letter-spacing: 8px; }
        .message { color: #374151; line-height: 1.8; }
        .warning { background: #fef3c7; border-radius: 8px; padding: 15px; margin: 15px 0; color: #92400e; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🔐 ${APP_NAME}</div>
        <div class="message">
          <p>${greeting}،</p>
          <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. استخدم الرمز التالي:</p>
        </div>
        <div class="code">
          <div class="code-number">${code}</div>
        </div>
        <div class="message">
          <p>هذا الرمز صالح لمدة <strong>15 دقيقة</strong>.</p>
        </div>
        <div class="warning">
          ⚠️ إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة وتأمين حسابك.
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${greeting}،

لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.

رمز إعادة التعيين: ${code}

هذا الرمز صالح لمدة 15 دقيقة.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
  `;

  return sendEmail({
    to: email,
    subject: `${code} - إعادة تعيين كلمة المرور - ${APP_NAME}`,
    html,
    text,
  });
};

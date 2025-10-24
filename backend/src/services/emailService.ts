import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration
const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};

// Create transporter
function createTransporter() {
    return nodemailer.createTransport({
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        auth: {
            user: EMAIL_CONFIG.user,
            pass: EMAIL_CONFIG.password,
        },
    });
}

// Generate 6-digit security code
export const generateSecurityCode = (): string => {
    return crypto.randomInt(100000, 999999).toString();
};

// Generate secure reset token
export const generateResetToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Send password reset email with security code
export const sendPasswordResetEmail = async (
    email: string,
    securityCode: string,
    username?: string
): Promise<void> => {
    console.log('📧 [EMAIL] Sending password reset email to:', email);

    // In test mode, skip actual email sending
    if (process.env.NODE_ENV === 'test') {
        console.log(`✅ [EMAIL] Test mode - skipping actual email send. Code: ${securityCode}`);
        return;
    }

    const transporter = createTransporter();
    
    if (!transporter) {
        console.error('❌ [EMAIL] Failed to create transporter');
        throw new Error('Email service is not configured');
    }

    const mailOptions = {
        from: EMAIL_CONFIG.from,
        to: email,
        subject: '🔐 CityPulse - Password Reset Code',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - CityPulse</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #ff9900, #ffb547); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .code-container { background: #f8f9fa; border: 2px dashed #ff9900; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
                .security-code { font-size: 36px; font-weight: bold; color: #ff9900; letter-spacing: 8px; font-family: monospace; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
                .button { display: inline-block; background: #ff9900; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌟 CityPulse</h1>
                    <p>Password Reset Request</p>
                </div>
                
                <div class="content">
                    <h2>Hello${username ? ` ${username}` : ''}!</h2>
                    
                    <p>We received a request to reset your password for your CityPulse account. Use the security code below to continue:</p>
                    
                    <div class="code-container">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #666;">Your Security Code:</p>
                        <div class="security-code">${securityCode}</div>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">This code expires in 15 minutes</p>
                    </div>
                    
                    <p>Enter this code on the password reset page to verify your identity and set a new password.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Note:</strong> If you didn't request a password reset, please ignore this email. Your account remains secure.
                    </div>
                    
                    <p>For security reasons, this code will expire in 15 minutes. If you need a new code, you can request another password reset.</p>
                </div>
                
                <div class="footer">
                    <p>This email was sent from CityPulse. If you have any questions, please contact our support team.</p>
                    <p style="font-size: 12px; color: #999;">© 2025 CityPulse. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `,
        text: `
            CityPulse - Password Reset

            Hello${username ? ` ${username}` : ''}!

            We received a request to reset your password for your CityPulse account.

            Your Security Code: ${securityCode}

            This code expires in 15 minutes. Enter this code on the password reset page to verify your identity and set a new password.

            If you didn't request a password reset, please ignore this email. Your account remains secure.

            © 2025 CityPulse. All rights reserved.
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ [EMAIL] Password reset email sent successfully to: ${email}`);
    } catch (error) {
        console.error('❌ [EMAIL] Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

// Send password reset success notification
export const sendPasswordResetSuccessEmail = async (
    email: string,
    username?: string
): Promise<void> => {
    // In test mode, skip actual email sending
    if (process.env.NODE_ENV === 'test') {
        console.log(`✅ [EMAIL] Test mode - skipping success email send to: ${email}`);
        return;
    }

    const transporter = createTransporter();
    
    if (!transporter) {
        return; // Silently fail if email is not configured
    }

    const mailOptions = {
        from: EMAIL_CONFIG.from,
        to: email,
        subject: '✅ CityPulse - Password Successfully Reset',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Success - CityPulse</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #1db981, #009688); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌟 CityPulse</h1>
                    <p>Password Reset Successful</p>
                </div>
                
                <div class="content">
                    <h2>Hello${username ? ` ${username}` : ''}!</h2>
                    
                    <div class="success">
                        <strong>✅ Success!</strong> Your password has been successfully reset.
                    </div>
                    
                    <p>Your CityPulse account password has been changed. You can now sign in with your new password.</p>
                    
                    <p>If you didn't make this change or if you have any concerns about your account security, please contact our support team immediately.</p>
                    
                    <p>Thank you for using CityPulse!</p>
                </div>
                
                <div class="footer">
                    <p>This email was sent from CityPulse. If you have any questions, please contact our support team.</p>
                    <p style="font-size: 12px; color: #999;">© 2025 CityPulse. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset success email sent to: ${email}`);
    } catch (error) {
        console.error('❌ Failed to send password reset success email:', error);
        // Don't throw error for success notifications
    }
};
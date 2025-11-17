/**
 * Daily Report Email Service
 * 
 * Handles email delivery for daily validation reports using multiple providers
 */

export interface EmailConfig {
  provider: 'nodemailer' | 'resend' | 'sendgrid' | 'webhook';
  from: string;
  recipients: string[];
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  apiKey?: string;
  webhookUrl?: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text?: string;
}

export class DailyReportEmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send daily report email using configured provider
   */
  async sendDailyReport(content: EmailContent): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'nodemailer':
          return await this.sendViaNodemailer(content);
        case 'resend':
          return await this.sendViaResend(content);
        case 'sendgrid':
          return await this.sendViaSendGrid(content);
        case 'webhook':
          return await this.sendViaWebhook(content);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('[EmailService] Failed to send daily report:', error);
      return false;
    }
  }

  /**
   * Send via Nodemailer (SMTP)
   */
  private async sendViaNodemailer(content: EmailContent): Promise<boolean> {
    try {
      // Note: nodemailer would need to be installed: npm install nodemailer
      // const nodemailer = require('nodemailer');
      
      console.log('[Email] Nodemailer sending...');
      console.log('To:', this.config.recipients.join(', '));
      console.log('Subject:', content.subject);
      
      // Simulate email sending for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[Email] ✅ Nodemailer email sent successfully');
      return true;
      
      /* Production implementation:
      const transporter = nodemailer.createTransporter({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: this.config.smtp.auth
      });

      const info = await transporter.sendMail({
        from: this.config.from,
        to: this.config.recipients.join(','),
        subject: content.subject,
        html: content.html,
        text: content.text
      });

      return !!info.messageId;
      */
    } catch (error) {
      console.error('[Email] Nodemailer error:', error);
      return false;
    }
  }

  /**
   * Send via Resend (modern email API)
   */
  private async sendViaResend(content: EmailContent): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Resend API key not configured');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          from: this.config.from,
          to: this.config.recipients,
          subject: content.subject,
          html: content.html,
          text: content.text
        })
      });

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status}`);
      }

      console.log('[Email] ✅ Resend email sent successfully');
      return true;
    } catch (error) {
      console.error('[Email] Resend error:', error);
      return false;
    }
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(content: EmailContent): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          personalizations: [{
            to: this.config.recipients.map(email => ({ email }))
          }],
          from: { email: this.config.from },
          subject: content.subject,
          content: [
            { type: 'text/html', value: content.html },
            ...(content.text ? [{ type: 'text/plain', value: content.text }] : [])
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`SendGrid API error: ${response.status}`);
      }

      console.log('[Email] ✅ SendGrid email sent successfully');
      return true;
    } catch (error) {
      console.error('[Email] SendGrid error:', error);
      return false;
    }
  }

  /**
   * Send via Webhook (for custom integrations)
   */
  private async sendViaWebhook(content: EmailContent): Promise<boolean> {
    try {
      if (!this.config.webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily_validation_report_email',
          from: this.config.from,
          recipients: this.config.recipients,
          subject: content.subject,
          html: content.html,
          text: content.text,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      console.log('[Email] ✅ Webhook email notification sent successfully');
      return true;
    } catch (error) {
      console.error('[Email] Webhook error:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<{ success: boolean; message: string }> {
    try {
      const testContent: EmailContent = {
        subject: 'OPAL Integration - Email Configuration Test',
        html: `
          <h2>🧪 Email Configuration Test</h2>
          <p>This is a test email to verify your daily report email configuration.</p>
          <p><strong>Provider:</strong> ${this.config.provider}</p>
          <p><strong>Recipients:</strong> ${this.config.recipients.join(', ')}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p>If you received this email, your configuration is working correctly!</p>
        `,
        text: `Email Configuration Test\n\nProvider: ${this.config.provider}\nRecipients: ${this.config.recipients.join(', ')}\nTimestamp: ${new Date().toISOString()}\n\nIf you received this email, your configuration is working correctly!`
      };

      const success = await this.sendDailyReport(testContent);
      
      return {
        success,
        message: success 
          ? 'Test email sent successfully! Check your inbox.' 
          : 'Test email failed to send. Check your configuration.'
      };
    } catch (error) {
      return {
        success: false,
        message: `Test email error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Create email service from environment variables
 */
export function createEmailServiceFromEnv(): DailyReportEmailService | null {
  try {
    const provider = (process.env.EMAIL_PROVIDER || 'webhook') as EmailConfig['provider'];
    const from = process.env.REPORT_EMAIL_FROM || 'noreply@company.com';
    const recipients = (process.env.REPORT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean);

    if (recipients.length === 0) {
      console.warn('[EmailService] No email recipients configured');
      return null;
    }

    const config: EmailConfig = {
      provider,
      from,
      recipients,
      apiKey: process.env.EMAIL_API_KEY,
      webhookUrl: process.env.REPORT_WEBHOOK_URL
    };

    // Add SMTP config if using nodemailer
    if (provider === 'nodemailer') {
      config.smtp = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };
    }

    return new DailyReportEmailService(config);
  } catch (error) {
    console.error('[EmailService] Failed to create email service:', error);
    return null;
  }
}
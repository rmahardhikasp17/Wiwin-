import { db } from './database';

export interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  enabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
}

export class EmailService {
  private config: EmailConfig = {
    enabled: false
  };

  async loadConfig(): Promise<EmailConfig> {
    try {
      const settings = await db.settings.toArray();
      const emailSettings = settings.filter(s => s.key.startsWith('email_'));
      
      this.config = {
        smtpHost: emailSettings.find(s => s.key === 'email_smtp_host')?.value,
        smtpPort: parseInt(emailSettings.find(s => s.key === 'email_smtp_port')?.value || '587'),
        smtpUser: emailSettings.find(s => s.key === 'email_smtp_user')?.value,
        smtpPassword: emailSettings.find(s => s.key === 'email_smtp_password')?.value,
        fromEmail: emailSettings.find(s => s.key === 'email_from')?.value,
        enabled: emailSettings.find(s => s.key === 'email_enabled')?.value === 'true'
      };
      
      return this.config;
    } catch (error) {
      console.error('Error loading email config:', error);
      return this.config;
    }
  }

  async saveConfig(config: EmailConfig): Promise<void> {
    try {
      const configMap = {
        'email_smtp_host': config.smtpHost || '',
        'email_smtp_port': config.smtpPort?.toString() || '587',
        'email_smtp_user': config.smtpUser || '',
        'email_smtp_password': config.smtpPassword || '',
        'email_from': config.fromEmail || '',
        'email_enabled': config.enabled.toString()
      };

      for (const [key, value] of Object.entries(configMap)) {
        const existingSetting = await db.settings.where('key').equals(key).first();
        
        if (existingSetting) {
          await db.settings.update(existingSetting.id!, { value });
        } else {
          await db.settings.add({ key, value });
        }
      }

      this.config = config;
    } catch (error) {
      console.error('Error saving email config:', error);
      throw error;
    }
  }

  getDefaultTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'budget_alert',
        name: 'Peringatan Anggaran',
        subject: '⚠️ Peringatan Anggaran - {{categoryName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">⚠️ Peringatan Anggaran</h2>
            <p>Halo {{userName}},</p>
            <p>Anggaran untuk kategori <strong>{{categoryName}}</strong> telah mencapai {{percentage}}% dari batas yang ditetapkan.</p>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Detail:</strong></p>
              <ul>
                <li>Kategori: {{categoryName}}</li>
                <li>Terpakai: {{spent}}</li>
                <li>Batas: {{budget}}</li>
                <li>Persentase: {{percentage}}%</li>
              </ul>
            </div>
            <p>Mohon pertimbangkan untuk mengatur pengeluaran agar tetap dalam batas anggaran.</p>
            <p>Salam,<br>Dompet Bergerak</p>
          </div>
        `,
        variables: ['userName', 'categoryName', 'spent', 'budget', 'percentage']
      },
      {
        id: 'target_achieved',
        name: 'Target Tercapai',
        subject: '🎉 Selamat! Target {{targetName}} Tercapai',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">🎉 Selamat! Target Tercapai</h2>
            <p>Halo {{userName}},</p>
            <p>Kami sangat senang memberitahu bahwa target tabungan <strong>{{targetName}}</strong> telah berhasil dicapai!</p>
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Detail Target:</strong></p>
              <ul>
                <li>Nama Target: {{targetName}}</li>
                <li>Target: {{targetAmount}}</li>
                <li>Tercapai: {{achievedAmount}}</li>
                <li>Tanggal Tercapai: {{achievedDate}}</li>
              </ul>
            </div>
            <p>Terima kasih atas konsistensi dan disiplin dalam menabung. Sekarang saatnya menikmati hasil jerih payah Anda!</p>
            <p>Salam,<br>Dompet Bergerak</p>
          </div>
        `,
        variables: ['userName', 'targetName', 'targetAmount', 'achievedAmount', 'achievedDate']
      },
      {
        id: 'monthly_report',
        name: 'Laporan Bulanan',
        subject: '📊 Laporan Keuangan Bulanan - {{month}} {{year}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">📊 Laporan Keuangan Bulanan</h2>
            <p>Halo {{userName}},</p>
            <p>Berikut adalah ringkasan keuangan Anda untuk bulan {{month}} {{year}}:</p>
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ringkasan Keuangan:</strong></p>
              <ul>
                <li>Total Pemasukan: {{totalIncome}}</li>
                <li>Total Pengeluaran: {{totalExpense}}</li>
                <li>Saldo: {{balance}}</li>
                <li>Transaksi: {{transactionCount}} transaksi</li>
              </ul>
            </div>
            <p>{{summary}}</p>
            <p>Tetap semangat mengelola keuangan Anda!</p>
            <p>Salam,<br>Dompet Bergerak</p>
          </div>
        `,
        variables: ['userName', 'month', 'year', 'totalIncome', 'totalExpense', 'balance', 'transactionCount', 'summary']
      }
    ];
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  async sendNotification(templateId: string, variables: Record<string, string>, toEmail?: string): Promise<void> {
    if (!this.config.enabled) {
      console.log('Email notifications are disabled');
      return;
    }

    const template = this.getDefaultTemplates().find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const userSettings = await db.settings.toArray();
    const userEmail = toEmail || userSettings.find(s => s.key === 'userEmail')?.value;
    
    if (!userEmail) {
      console.log('No email address configured for notifications');
      return;
    }

    const subject = this.replaceVariables(template.subject, variables);
    const htmlContent = this.replaceVariables(template.htmlContent, variables);

    // Note: This is a client-side implementation.
    // In a real application, you would send this to a backend service
    // that handles the actual email sending via SMTP.
    
    console.log('Email would be sent:', {
      to: userEmail,
      subject,
      html: htmlContent,
      template: templateId
    });

    // For now, we'll just log the email content
    // In production, you would integrate with services like:
    // - EmailJS for client-side email sending
    // - Backend API with nodemailer
    // - Third-party services like SendGrid, Mailgun, etc.
    
    // Store notification in local database for history
    try {
      await db.settings.add({
        key: `notification_${Date.now()}`,
        value: JSON.stringify({
          templateId,
          to: userEmail,
          subject,
          sentAt: new Date().toISOString(),
          variables
        })
      });
    } catch (error) {
      console.error('Error storing notification history:', error);
    }
  }

  async getNotificationHistory(): Promise<any[]> {
    try {
      const settings = await db.settings.toArray();
      const notifications = settings
        .filter(s => s.key.startsWith('notification_'))
        .map(s => ({
          id: s.id,
          key: s.key,
          ...JSON.parse(s.value)
        }))
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      
      return notifications;
    } catch (error) {
      console.error('Error loading notification history:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    // In a real implementation, this would test the SMTP connection
    // For now, we'll just validate the configuration
    if (!this.config.enabled) {
      return false;
    }

    const required = ['smtpHost', 'smtpUser', 'smtpPassword', 'fromEmail'];
    return required.every(field => this.config[field as keyof EmailConfig]);
  }
}

export const emailService = new EmailService();

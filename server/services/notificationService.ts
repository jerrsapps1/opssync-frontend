import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set. Email notifications will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string[];
  from: string;
  subject: string;
  html: string;
}

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  priority?: string;
}

export class NotificationService {
  private defaultFromEmail = "noreply@stafftrak.com";

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("Email sending skipped - SENDGRID_API_KEY not configured");
      return false;
    }

    try {
      await mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        html: params.html,
      });
      console.log(`Email sent successfully to ${params.to.join(', ')}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendWorkOrderApprovalNotification(
    workOrderData: {
      id: string;
      title: string;
      equipmentName: string;
      totalCost: number;
      approvalThreshold: number;
      createdBy?: string;
    },
    recipientEmails: string[]
  ): Promise<boolean> {
    if (!recipientEmails.length) {
      console.log("No recipient emails provided for work order approval notification");
      return false;
    }

    const subject = `Work Order Approval Required - $${workOrderData.totalCost.toFixed(2)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 20px; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
            🚨 Work Order Approval Required
          </h2>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <strong style="color: #856404;">Work Order Details:</strong>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li><strong>Title:</strong> ${workOrderData.title}</li>
              <li><strong>Equipment:</strong> ${workOrderData.equipmentName}</li>
              <li><strong>Total Cost:</strong> $${workOrderData.totalCost.toFixed(2)}</li>
              <li><strong>Approval Threshold:</strong> $${workOrderData.approvalThreshold.toFixed(2)}</li>
              ${workOrderData.createdBy ? `<li><strong>Created By:</strong> ${workOrderData.createdBy}</li>` : ''}
            </ul>
          </div>

          <p style="color: #333; line-height: 1.6; margin: 20px 0;">
            A new work order has been created that exceeds the approval threshold. The total cost of 
            <strong style="color: #dc3545;">$${workOrderData.totalCost.toFixed(2)}</strong> 
            requires authorization before work can begin.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'https://stafftrak.com'}/repair-shop" 
               style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Review Work Order
            </a>
          </div>

          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; color: #6c757d; font-size: 12px;">
            <p style="margin: 0;">
              This is an automated notification from StaffTrak Asset Management. 
              Please do not reply to this email.
            </p>
            <p style="margin: 5px 0 0 0;">
              To manage your notification preferences, visit your account settings.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: recipientEmails,
      from: this.defaultFromEmail,
      subject,
      html,
    });
  }

  async sendWorkOrderStatusUpdate(
    workOrderData: {
      id: string;
      title: string;
      equipmentName: string;
      status: string;
      updatedBy?: string;
    },
    recipientEmails: string[]
  ): Promise<boolean> {
    if (!recipientEmails.length) {
      console.log("No recipient emails provided for work order status update");
      return false;
    }

    const subject = `Work Order Status Update - ${workOrderData.title}`;
    
    const statusColor = workOrderData.status === 'approved' ? '#28a745' : 
                       workOrderData.status === 'rejected' ? '#dc3545' : '#17a2b8';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: ${statusColor}; margin-bottom: 20px; border-bottom: 2px solid ${statusColor}; padding-bottom: 10px;">
            📋 Work Order Status Update
          </h2>
          
          <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <strong style="color: #495057;">Work Order Details:</strong>
            <ul style="margin: 10px 0; padding-left: 20px; color: #495057;">
              <li><strong>Title:</strong> ${workOrderData.title}</li>
              <li><strong>Equipment:</strong> ${workOrderData.equipmentName}</li>
              <li><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: capitalize;">${workOrderData.status.replace('_', ' ')}</span></li>
              ${workOrderData.updatedBy ? `<li><strong>Updated By:</strong> ${workOrderData.updatedBy}</li>` : ''}
            </ul>
          </div>

          <p style="color: #333; line-height: 1.6; margin: 20px 0;">
            The status of work order "${workOrderData.title}" has been updated to 
            <strong style="color: ${statusColor};">${workOrderData.status.replace('_', ' ')}</strong>.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'https://stafftrak.com'}/repair-shop" 
               style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Work Order
            </a>
          </div>

          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; color: #6c757d; font-size: 12px;">
            <p style="margin: 0;">
              This is an automated notification from StaffTrak Asset Management. 
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: recipientEmails,
      from: this.defaultFromEmail,
      subject,
      html,
    });
  }
}

export const notificationService = new NotificationService();
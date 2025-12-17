import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { EnvConfig } from '../helper/config/env.config';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: EnvConfig.EMAIL_HOST,
      port: EnvConfig.EMAIL_PORT,
      secure: false,
      auth: {
        user: EnvConfig.EMAIL_USER,
        pass: EnvConfig.EMAIL_PASS,
      },
    });
  }

  async sendBookingConfirmation(data: {
    to: string;
    customerName: string;
    trackingNumber: string;
    pickupAddress: string;
    deliveryAddress: string;
  }): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .tracking { font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; padding: 10px; background: #e8f5e9; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Your parcel booking has been confirmed successfully.</p>
            <div class="tracking">
              Tracking Number: {{trackingNumber}}
            </div>
            <p><strong>Pickup Address:</strong><br>{{pickupAddress}}</p>
            <p><strong>Delivery Address:</strong><br>{{deliveryAddress}}</p>
            <p>You can track your parcel anytime using the tracking number above.</p>
            <p>Thank you for choosing our courier service!</p>
          </div>
          <div class="footer">
            <p>Courier & Parcel Management System</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const compiled = Handlebars.compile(template);
    const html = compiled(data);

    await this.transporter.sendMail({
      from: `"Courier System" <${EnvConfig.EMAIL_USER}>`,
      to: data.to,
      subject: '📦 Parcel Booking Confirmed',
      html,
    });
  }

  async sendStatusUpdate(data: {
    to: string;
    customerName: string;
    trackingNumber: string;
    status: string;
    statusMessage: string;
  }): Promise<void> {
    const statusColors: Record<string, string> = {
      picked_up: '#2196F3',
      in_transit: '#FF9800',
      delivered: '#4CAF50',
      failed: '#F44336',
    };

    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: {{statusColor}}; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .status-badge { display: inline-block; padding: 10px 20px; background: {{statusColor}}; color: white; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📍 Status Update</h1>
          </div>
          <div class="content">
            <p>Dear {{customerName}},</p>
            <p>Your parcel <strong>{{trackingNumber}}</strong> has been updated:</p>
            <p><span class="status-badge">{{statusMessage}}</span></p>
            <p>{{additionalInfo}}</p>
            <p>Thank you for using our service!</p>
          </div>
          <div class="footer">
            <p>Courier & Parcel Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const compiled = Handlebars.compile(template);
    const html = compiled({
      ...data,
      statusColor: statusColors[data.status] || '#666',
      additionalInfo:
        data.status === 'delivered'
          ? 'Your parcel has been successfully delivered!'
          : data.status === 'failed'
            ? 'Unfortunately, delivery attempt failed. We will retry soon.'
            : 'Your parcel is on the way!',
    });

    await this.transporter.sendMail({
      from: `"Courier System" <${EnvConfig.EMAIL_USER}>`,
      to: data.to,
      subject: `📦 Parcel ${data.statusMessage} - ${data.trackingNumber}`,
      html,
    });
  }

  async sendDeliveryConfirmation(data: {
    to: string;
    customerName: string;
    trackingNumber: string;
    deliveryAddress: string;
  }): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .success-icon { font-size: 48px; text-align: center; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Delivered Successfully!</h1>
          </div>
          <div class="content">
            <div class="success-icon">📦✓</div>
            <p>Dear {{customerName}},</p>
            <p>Your parcel <strong>{{trackingNumber}}</strong> has been successfully delivered to:</p>
            <p><strong>{{deliveryAddress}}</strong></p>
            <p>Thank you for choosing our courier service. We hope to serve you again!</p>
          </div>
          <div class="footer">
            <p>Courier & Parcel Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const compiled = Handlebars.compile(template);
    const html = compiled(data);

    await this.transporter.sendMail({
      from: `"Courier System" <${EnvConfig.EMAIL_USER}>`,
      to: data.to,
      subject: `✅ Parcel Delivered - ${data.trackingNumber}`,
      html,
    });
  }
}

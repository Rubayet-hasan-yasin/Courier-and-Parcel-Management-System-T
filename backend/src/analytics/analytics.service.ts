import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Parcel } from '../parcel/entities/parcel.entity';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import type { Response } from 'express';
import * as puppeteer from 'puppeteer';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Parcel)
        private readonly parcelRepository: Repository<Parcel>,
    ) { }

    async getDashboardStats(startDate?: Date, endDate?: Date) {
        const whereClause: any = {};

        if (startDate && endDate) {
            whereClause.createdAt = Between(startDate, endDate);
        }

        try {
            // Optimized: Don't load relations for stats, only get the data we need
            const parcels = await this.parcelRepository.find({
                where: whereClause,
                select: ['id', 'status', 'paymentMethod', 'deliveryCharge', 'codAmount', 'createdAt'],
            });

            const total = parcels.length;

            const byStatus = parcels.reduce((acc, parcel) => {
                acc[parcel.status] = (acc[parcel.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const byPaymentMethod = parcels.reduce((acc, parcel) => {
                acc[parcel.paymentMethod] = (acc[parcel.paymentMethod] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const totalRevenue = parcels.reduce(
                (sum, parcel) => sum + (parcel.deliveryCharge || 0),
                0,
            );

            const totalCOD = parcels
                .filter((p) => p.paymentMethod === 'cod')
                .reduce((sum, parcel) => sum + (parcel.codAmount || 0), 0);

            const deliveryRate =
                total > 0 ? ((byStatus['delivered'] || 0) / total) * 100 : 0;

            return {
                total,
                byStatus,
                byPaymentMethod,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalCOD: parseFloat(totalCOD.toFixed(2)),
                deliveryRate: deliveryRate.toFixed(2),
                dateRange: {
                    start: startDate || parcels[0]?.createdAt,
                    end: endDate || new Date(),
                },
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Return empty stats on error
            return {
                total: 0,
                byStatus: {},
                byPaymentMethod: {},
                totalRevenue: 0,
                totalCOD: 0,
                deliveryRate: '0.00',
                dateRange: {
                    start: startDate || new Date(),
                    end: endDate || new Date(),
                },
            };
        }
    }

    async generateCSVReport(res: Response, startDate?: Date, endDate?: Date) {
        const whereClause: any = {};

        if (startDate && endDate) {
            whereClause.createdAt = Between(startDate, endDate);
        }

        const parcels = await this.parcelRepository.find({
            where: whereClause,
            relations: ['customer', 'agent'],
            order: { createdAt: 'DESC' },
        });

        const csvData = parcels.map((parcel) => ({
            trackingNumber: parcel.trackingNumber,
            customerName: parcel.customer?.name || 'N/A',
            customerEmail: parcel.customer?.email || 'N/A',
            agentName: parcel.agent?.name || 'Not Assigned',
            pickupAddress: parcel.pickupAddress,
            deliveryAddress: parcel.deliveryAddress,
            status: parcel.status,
            paymentMethod: parcel.paymentMethod,
            codAmount: parcel.codAmount || 0,
            deliveryCharge: parcel.deliveryCharge || 0,
            parcelSize: parcel.parcelSize,
            parcelType: parcel.parcelType,
            weight: parcel.weight || 'N/A',
            createdAt: parcel.createdAt.toISOString(),
            deliveredAt: parcel.deliveredAt?.toISOString() || 'N/A',
        }));

        const csvWriter = createCsvWriter({
            path: 'temp-report.csv',
            header: [
                { id: 'trackingNumber', title: 'Tracking Number' },
                { id: 'customerName', title: 'Customer Name' },
                { id: 'customerEmail', title: 'Customer Email' },
                { id: 'agentName', title: 'Agent Name' },
                { id: 'pickupAddress', title: 'Pickup Address' },
                { id: 'deliveryAddress', title: 'Delivery Address' },
                { id: 'status', title: 'Status' },
                { id: 'paymentMethod', title: 'Payment Method' },
                { id: 'codAmount', title: 'COD Amount' },
                { id: 'deliveryCharge', title: 'Delivery Charge' },
                { id: 'parcelSize', title: 'Parcel Size' },
                { id: 'parcelType', title: 'Parcel Type' },
                { id: 'weight', title: 'Weight (kg)' },
                { id: 'createdAt', title: 'Created At' },
                { id: 'deliveredAt', title: 'Delivered At' },
            ],
        });

        await csvWriter.writeRecords(csvData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=parcels-report-${Date.now()}.csv`,
        );

        const fs = require('fs');
        const stream = fs.createReadStream('temp-report.csv');
        stream.pipe(res);
        stream.on('end', () => {
            fs.unlinkSync('temp-report.csv');
        });
    }

    async generatePDFReport(res: Response, startDate?: Date, endDate?: Date) {
        try {
            const stats = await this.getDashboardStats(startDate, endDate);

            const whereClause: any = {};
            if (startDate && endDate) {
                whereClause.createdAt = Between(startDate, endDate);
            }

            const parcels = await this.parcelRepository.find({
                where: whereClause,
                relations: ['customer', 'agent'],
                order: { createdAt: 'DESC' },
                take: 100,
            });

            // Generate HTML template
            const html = this.generatePDFHTML(stats, parcels);

            // Use Puppeteer to convert HTML to PDF
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
            });

            await browser.close();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=parcels-report-${Date.now()}.pdf`,
            );
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating PDF report:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Failed to generate PDF report',
                    error: error.message,
                });
            }
        }
    }

    private generatePDFHTML(stats: any, parcels: any[]): string {
        const statusColors: Record<string, string> = {
            pending: '#9CA3AF',
            picked_up: '#3B82F6',
            in_transit: '#FBBF24',
            delivered: '#10B981',
            failed: '#EF4444',
        };

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #f9fafb;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3B82F6;
        }
        .header h1 {
            color: #1F2937;
            font-size: 32px;
            margin-bottom: 8px;
        }
        .header h2 {
            color: #6B7280;
            font-size: 20px;
            font-weight: normal;
        }
        .header p {
            color: #9CA3AF;
            font-size: 14px;
            margin-top: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #3B82F6;
        }
        .stat-label {
            color: #6B7280;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .stat-value {
            color: #1F2937;
            font-size: 28px;
            font-weight: bold;
        }
        .section-title {
            color: #1F2937;
            font-size: 18px;
            font-weight: 600;
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #E5E7EB;
        }
        .parcels-table {
            width: 100%;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .parcels-table th {
            background: #F3F4F6;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            color: #6B7280;
            font-weight: 600;
        }
        .parcels-table td {
            padding: 12px;
            border-top: 1px solid #E5E7EB;
            font-size: 12px;
            color: #374151;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .tracking-number {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #1F2937;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            color: #9CA3AF;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Courier Management System</h1>
        <h2>Parcels Report</h2>
        <p>Period: ${stats.dateRange.start?.toLocaleDateString() || 'N/A'} - ${stats.dateRange.end?.toLocaleDateString() || 'N/A'}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total Parcels</div>
            <div class="stat-value">${stats.total}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Delivered</div>
            <div class="stat-value" style="color: #10B981;">${stats.byStatus['delivered'] || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Delivery Rate</div>
            <div class="stat-value" style="color: #3B82F6;">${stats.deliveryRate}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">In Transit</div>
            <div class="stat-value" style="color: #FBBF24;">${(stats.byStatus['picked_up'] || 0) + (stats.byStatus['in_transit'] || 0)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value" style="color: #8B5CF6;">৳${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total COD</div>
            <div class="stat-value" style="color: #EC4899;">৳${stats.totalCOD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
    </div>

    <h3 class="section-title">Recent Parcels (${parcels.length})</h3>

    <table class="parcels-table">
        <thead>
            <tr>
                <th>Tracking #</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Agent</th>
            </tr>
        </thead>
        <tbody>
            ${parcels.map(parcel => `
                <tr>
                    <td>
                        <span class="tracking-number">${parcel.trackingNumber}</span>
                        ${parcel.description ? `<br><span style="font-size: 10px; color: #9CA3AF;">${parcel.description}</span>` : ''}
                    </td>
                    <td>
                        <div>${parcel.customer?.name || 'N/A'}</div>
                        <div style="font-size: 10px; color: #9CA3AF;">${parcel.customer?.email || ''}</div>
                    </td>
                    <td style="max-width: 200px;">
                        <div style="font-size: 10px;">From: ${parcel.pickupAddress}</div>
                        <div style="font-size: 10px; color: #9CA3AF;">To: ${parcel.deliveryAddress}</div>
                    </td>
                    <td>
                        <span class="status-badge" style="background: ${statusColors[parcel.status] || '#9CA3AF'}; color: white;">
                            ${parcel.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td>
                        ${parcel.paymentMethod === 'cod' ? `COD ৳${parcel.codAmount}` : 'Prepaid'}
                    </td>
                    <td>${parcel.agent?.name || 'Not Assigned'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        Generated on ${new Date().toLocaleString()} | Courier & Parcel Management System
    </div>
</body>
</html>
        `;
    }
}

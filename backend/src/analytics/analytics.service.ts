import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Parcel } from '../parcel/entities/parcel.entity';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import PDFDocument = require('pdfkit');
import type { Response } from 'express';

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

        const [parcels, total] = await this.parcelRepository.findAndCount({
            where: whereClause,
            relations: ['customer', 'agent'],
        });

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
            totalRevenue,
            totalCOD,
            deliveryRate: deliveryRate.toFixed(2),
            dateRange: {
                start: startDate || parcels[0]?.createdAt,
                end: endDate || new Date(),
            },
        };
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
        const stats = await this.getDashboardStats(startDate, endDate);

        const whereClause: any = {};
        if (startDate && endDate) {
            whereClause.createdAt = Between(startDate, endDate);
        }

        const parcels = await this.parcelRepository.find({
            where: whereClause,
            relations: ['customer', 'agent'],
            order: { createdAt: 'DESC' },
            take: 50,
        });

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=parcels-report-${Date.now()}.pdf`,
        );

        doc.pipe(res);

        doc.fontSize(20).text('Courier Management System', { align: 'center' });
        doc.fontSize(16).text('Parcels Report', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).text(
            `Report Period: ${stats.dateRange.start?.toLocaleDateString()} - ${stats.dateRange.end?.toLocaleDateString()}`,
            { align: 'center' },
        );
        doc.moveDown(2);

        doc.fontSize(14).text('Summary Statistics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Total Parcels: ${stats.total}`);
        doc.text(`Delivered: ${stats.byStatus['delivered'] || 0}`);
        doc.text(`In Transit: ${(stats.byStatus['picked_up'] || 0) + (stats.byStatus['in_transit'] || 0)}`);
        doc.text(`Failed: ${stats.byStatus['failed'] || 0}`);
        doc.text(`Delivery Rate: ${stats.deliveryRate}%`);
        doc.text(`Total Revenue: ৳${stats.totalRevenue}`);
        doc.text(`Total COD: ৳${stats.totalCOD}`);
        doc.moveDown(2);

        doc.fontSize(14).text('Recent Parcels', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(8);

        parcels.forEach((parcel, index) => {
            if (index > 0 && index % 10 === 0) {
                doc.addPage();
            }

            doc.fontSize(9).text(`${index + 1}. ${parcel.trackingNumber}`, { continued: true });
            doc.fontSize(8).text(` - ${parcel.status}`, { continued: true });
            doc.text(` - ${parcel.customer?.name || 'N/A'}`);
            doc.fontSize(7).text(`   From: ${parcel.pickupAddress}`);
            doc.text(`   To: ${parcel.deliveryAddress}`);
            doc.moveDown(0.3);
        });

        doc.end();
    }
}

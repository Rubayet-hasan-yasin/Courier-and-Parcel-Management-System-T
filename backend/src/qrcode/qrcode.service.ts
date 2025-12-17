import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { ParcelService } from '../parcel/parcel.service';

@Injectable()
export class QrcodeService {
    constructor(private readonly parcelService: ParcelService) { }

    async generateQRCode(parcelId: number): Promise<{
        qrCode: string;
        trackingNumber: string;
    }> {
        const parcel = await this.parcelService.findOne(parcelId);

        const qrData = JSON.stringify({
            trackingNumber: parcel.trackingNumber,
            parcelId: parcel.id,
            type: 'COURIER_PARCEL',
        });

        const qrCodeBase64 = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2,
        });

        parcel.qrCode = qrCodeBase64;
        await this.parcelService.update(parcel.id, { ...parcel } as any);

        return {
            qrCode: qrCodeBase64,
            trackingNumber: parcel.trackingNumber,
        };
    }

    async validateQRCode(qrData: string): Promise<{
        valid: boolean;
        parcel?: any;
        message: string;
    }> {
        try {
            const parsed = JSON.parse(qrData);

            if (
                !parsed.trackingNumber ||
                !parsed.parcelId ||
                parsed.type !== 'COURIER_PARCEL'
            ) {
                return {
                    valid: false,
                    message: 'Invalid QR code format',
                };
            }

            try {
                const parcel = await this.parcelService.findByTrackingNumber(
                    parsed.trackingNumber,
                );

                if (parcel.id !== parsed.parcelId) {
                    return {
                        valid: false,
                        message: 'QR code does not match parcel data',
                    };
                }

                return {
                    valid: true,
                    parcel,
                    message: 'QR code validated successfully',
                };
            } catch (error) {
                return {
                    valid: false,
                    message: 'Parcel not found',
                };
            }
        } catch (error) {
            return {
                valid: false,
                message: 'Invalid QR code data format',
            };
        }
    }

    async confirmPickup(qrData: string, userId: number, userRole: string): Promise<any> {
        const validation = await this.validateQRCode(qrData);

        if (!validation.valid || !validation.parcel) {
            throw new NotFoundException(validation.message);
        }

        return this.parcelService.updateStatus(
            validation.parcel.id,
            { status: 'picked_up' as any },
            userId,
            userRole as any,
        );
    }

    async confirmDelivery(qrData: string, userId: number, userRole: string): Promise<any> {
        const validation = await this.validateQRCode(qrData);

        if (!validation.valid || !validation.parcel) {
            throw new NotFoundException(validation.message);
        }

        return this.parcelService.updateStatus(
            validation.parcel.id,
            { status: 'delivered' as any },
            userId,
            userRole as any,
        );
    }
}

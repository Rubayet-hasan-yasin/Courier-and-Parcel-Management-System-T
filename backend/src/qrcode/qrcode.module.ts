import { Module } from '@nestjs/common';
import { QrcodeService } from './qrcode.service';
import { QrcodeController } from './qrcode.controller';
import { ParcelModule } from '../parcel/parcel.module';

/**
 * QR Code Module
 * Handles QR code generation and scanning for parcels
 */
@Module({
  imports: [ParcelModule],
  controllers: [QrcodeController],
  providers: [QrcodeService],
  exports: [QrcodeService],
})
export class QrcodeModule { }

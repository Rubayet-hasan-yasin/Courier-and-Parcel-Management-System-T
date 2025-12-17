import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QrcodeService } from './qrcode.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/enums/user-role.enum';

/**
 * QR Code Controller
 * Handles QR code generation and scanning endpoints
 */
@ApiTags('QR Code')
@Controller('qrcode')
export class QrcodeController {
  constructor(private readonly qrcodeService: QrcodeService) { }

  @Get('generate/:parcelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate QR code for parcel' })
  @ApiResponse({ status: 200, description: 'QR code generated (base64)' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  generateQRCode(@Param('parcelId', ParseIntPipe) parcelId: number) {
    return this.qrcodeService.generateQRCode(parcelId);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate scanned QR code (Public)' })
  @ApiResponse({ status: 200, description: 'QR code validation result' })
  validateQRCode(@Body() body: { qrData: string }) {
    return this.qrcodeService.validateQRCode(body.qrData);
  }

  @Post('confirm-pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm parcel pickup via QR scan (Agent/Admin)' })
  @ApiResponse({ status: 200, description: 'Pickup confirmed' })
  @ApiResponse({ status: 404, description: 'Invalid QR code' })
  confirmPickup(
    @Body() body: { qrData: string },
    @CurrentUser() user: any,
  ) {
    return this.qrcodeService.confirmPickup(body.qrData, user.userId, user.role);
  }

  @Post('confirm-delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm parcel delivery via QR scan (Agent/Admin)' })
  @ApiResponse({ status: 200, description: 'Delivery confirmed' })
  @ApiResponse({ status: 404, description: 'Invalid QR code' })
  confirmDelivery(
    @Body() body: { qrData: string },
    @CurrentUser() user: any,
  ) {
    return this.qrcodeService.confirmDelivery(body.qrData, user.userId, user.role);
  }
}

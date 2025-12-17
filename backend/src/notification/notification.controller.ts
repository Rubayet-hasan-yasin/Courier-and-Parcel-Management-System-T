import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/user-role.enum';

/**
 * Notification Controller
 * Internal endpoints for triggering email notifications
 * (Typically called by other services, not directly by users)
 */
@ApiTags('Notifications')
@Controller('notification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('test-email')
  @ApiOperation({ summary: 'Test email configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test email sent' })
  async testEmail(@Body() body: { email: string }) {
    await this.notificationService.sendBookingConfirmation({
      to: body.email,
      customerName: 'Test User',
      trackingNumber: 'TEST-123-ABC',
      pickupAddress: '123 Test St, Dhaka',
      deliveryAddress: '456 Demo Ave, Chittagong',
    });

    return { message: 'Test email sent successfully' };
  }
}

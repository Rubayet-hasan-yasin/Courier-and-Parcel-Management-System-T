import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

/**
 * Notification Module
 * Handles email notifications for parcel events
 */
@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService], // Export for use in other modules
})
export class NotificationModule { }

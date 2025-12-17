import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './helper/config/database.config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ParcelModule } from './parcel/parcel.module';
import { LocationModule } from './location/location.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { NotificationModule } from './notification/notification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), UserModule, AuthModule, ParcelModule, LocationModule, QrcodeModule, NotificationModule, AnalyticsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

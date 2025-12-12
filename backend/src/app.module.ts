import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { databaseConfig } from './helper/config/database.config';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

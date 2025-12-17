import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('config')
  getAppConfig() {
    return {
      googleMapsApiKey: process.env.GMAP_API_KEY,
    };
  }
}

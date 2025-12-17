import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { EnvConfig } from './helper/config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Courier & Parcel Management System API')
    .setDescription(
      'Complete API documentation for the courier tracking and parcel management system. Includes authentication, parcel booking, real-time tracking, analytics, and more.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .addTag('Authentication', 'User registration and login endpoints')
    .addTag('Users', 'User management and profile operations')
    .addTag('Parcels', 'Parcel booking and management')
    .addTag('Location', 'Real-time location tracking')
    .addTag('Analytics', 'Dashboard metrics and reports')
    .addTag('Notifications', 'Email notifications')
    .addTag('QR Code', 'QR code generation and scanning')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Courier Management API',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = EnvConfig.PORT || 5000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📡 External Access: http://${process.env.IP_ADDRESS || '192.168.31.223'}:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();

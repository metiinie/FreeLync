import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Hardening
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Needed for cross-origin images/resources
  }));

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        frontendUrl,
        'https://free-lync-site.vercel.app', // Explicitly added as requested
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`FreeLync API is active on port ${port}`);
}
bootstrap();

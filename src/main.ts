import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exception/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Correct CORS configuration
  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from your frontend's origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());

  app.useStaticAssets(join(__dirname, '..', 'resources'));
  await app.listen(process.env.PORT || 4000);
}
bootstrap();

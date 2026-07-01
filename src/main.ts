import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeDatabase } from './database';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await initializeDatabase();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

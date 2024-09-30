import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimeoutMiddleware } from './middleware/timeout.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/gateway/auth', new TimeoutMiddleware().use);
  app.use('/gateway/game-store', new TimeoutMiddleware().use);
  await app.listen(3000);
}
bootstrap();

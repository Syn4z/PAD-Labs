import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimeoutMiddleware } from './middleware/timeout.middleware';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'game_store',
      protoPath: './src/grpc/game_store.proto',
      url: '0.0.0.0:50051',
    },
  });
  app.use('/gateway/auth', new TimeoutMiddleware().use);
  app.use('/gateway/game-store', new TimeoutMiddleware().use);
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();

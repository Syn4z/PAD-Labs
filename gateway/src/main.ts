import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimeoutMiddleware } from './middleware/timeout.middleware';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format((info) => {
        info.tags = ['gateway'];
        return info;
      })()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.Http({
        port: 5046,
        host: 'logstash',
        ssl: false,
      })
    ]
  });
  app.useLogger(logger);
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
  logger.info(JSON.stringify({
    "service": "gateway",
    "msg": `Gateway started on port 3000`,
  }));
}
bootstrap();
import { Transport, ClientOptions } from '@nestjs/microservices';

export const grpcOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'game_store',
    protoPath: './src/grpc/game_store.proto',
    url: '0.0.0.0:50051',
  },
};
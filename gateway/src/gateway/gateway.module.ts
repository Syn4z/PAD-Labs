import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GatewayService } from './gateway.service';
import { GatewayController } from './gateway.controller';

@Module({
  imports: [HttpModule],
  providers: [GatewayService],
  controllers: [GatewayController],
})
export class GatewayModule {}
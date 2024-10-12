import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { ConsulModule } from '../load-balancer/consul.module';
import { LoadBalancerModule } from '../load-balancer/load-balancer.module';

@Module({
  imports: [ConsulModule, LoadBalancerModule],
  controllers: [GatewayController],
})
export class GatewayModule {}
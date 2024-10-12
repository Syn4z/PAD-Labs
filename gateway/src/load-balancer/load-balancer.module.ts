import { Module } from '@nestjs/common';
import { RoundRobinService } from './load-balancer.service';

@Module({
  providers: [RoundRobinService],
  exports: [RoundRobinService],
})
export class LoadBalancerModule {}

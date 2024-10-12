import { Module } from '@nestjs/common';
import { RoundRobinService } from './round-robin-balancer.service';

@Module({
  providers: [RoundRobinService],
  exports: [RoundRobinService],
})
export class LoadBalancerModule {}

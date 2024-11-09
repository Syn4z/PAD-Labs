import { Module } from '@nestjs/common';
import { RoundRobinService } from './round-robin-balancer.service';
import { ServiceLoadBalancer } from './service-load-balancer.service';
import { ConsulModule } from './consul.module';

@Module({
  imports: [ConsulModule],
  providers: [RoundRobinService, ServiceLoadBalancer],
  exports: [RoundRobinService, ServiceLoadBalancer],
})
export class LoadBalancerModule {}

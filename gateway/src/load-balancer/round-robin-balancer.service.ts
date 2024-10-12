import { Injectable } from '@nestjs/common';
import { BaseLoadBalancerService } from './load-balancer.service';

@Injectable()
export class RoundRobinService extends BaseLoadBalancerService {
  private index = 0;

  constructor() {
    super(3, 1, 5000); // 3 failures, 1 success, 5 seconds timeout
  }

  async getNextInstance(instances: string[], servicePrefix: string): Promise<string> {
    if (instances.length === 0) {
      throw new Error('No available service instances');
    }

    const instance = instances[this.index];
    this.index = (this.index + 1) % instances.length;

    try {
      await this.circuitBreaker.call(() => this.callService(instance, servicePrefix));
      return instance;
    } catch (error) {
      console.error(`Service call failed: ${error.message}`);
      throw new Error('Service call failed');
    }
  }
}
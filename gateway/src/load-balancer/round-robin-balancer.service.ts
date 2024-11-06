import { Injectable } from '@nestjs/common';
import { BaseLoadBalancerService } from './load-balancer.service';

@Injectable()
export class RoundRobinService extends BaseLoadBalancerService {
  private index = 0;

  constructor() {
    const consulHost = process.env.CONSUL_HOST || 'localhost';
    const consulPort = parseInt(process.env.CONSUL_PORT, 10) || 8500;
    const consulUrl = `http://${consulHost}:${consulPort}`;
    super(3, 5000, consulUrl); // 3 failures, 1 success, 5 seconds timeout
  }

  async getNextInstance(instances: string[], servicePrefix: string, serviceName: string): Promise<string> {
    if (instances.length === 0) {
      throw new Error('No available service instances');
    }

    let attempts = 0;
    let lastError: any;

    while (attempts < 3) {
      const instance = instances[this.index];
      this.index = (this.index + 1) % instances.length;

      try {
        this.circuitBreaker.serviceId = `${serviceName}-${instance.split(':')[0]}`;
        await this.circuitBreaker.call(() => this.callService(instance, servicePrefix));
        return instance;
      } catch (error) {
        lastError = error;
        console.error(`Service call failed for instance ${instance}: ${error.message}`);
        attempts++;
        await this.circuitBreaker.deregisterService();
      }
    }

    throw new Error('All service instances are unavailable');
  }
}
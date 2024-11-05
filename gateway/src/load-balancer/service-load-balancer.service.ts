import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { LoadCircuitBreaker } from '../middleware/load-circuit-breaker.middleware';
import { BaseLoadBalancerService } from './load-balancer.service';

@Injectable()
export class ServiceLoadBalancer extends BaseLoadBalancerService {
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

    const instanceLoads = await Promise.all(instances.map(async (instance) => {
      try {
        const [ip] = instance.split(':');
        this.circuitBreaker.serviceId = `${serviceName}-${ip}`;
        const response = await this.circuitBreaker.call(() => axios.get(`http://${instance}/${servicePrefix}/load`));
        console.log(`Load for instance ${instance}: ${response.data.cpu_usage}`);
        return { instance, load: response.data.cpu_usage };
      } catch (error) {
        console.error(`Error fetching load for instance ${instance}: ${error.message}`);
        const [ip] = instance.split(':');
        this.circuitBreaker.serviceId = `${serviceName}-${ip}`;
        await this.circuitBreaker.deregisterService();
        return { instance, load: Infinity };
      }
    }));

    const sortedInstances = instanceLoads
      .filter(instanceLoad => instanceLoad.load !== Infinity)
      .sort((a, b) => a.load - b.load);

    if (sortedInstances.length === 0) {
      throw new Error('No available service instances');
    }

    let attempts = 0;
    let lastError: any;

    while (attempts < 3 && sortedInstances.length > 0) {
      const leastLoadedInstance = sortedInstances.shift();
      try {
        this.circuitBreaker.serviceId = `${serviceName}-${leastLoadedInstance.instance.split(':')[0]}`;
        await this.circuitBreaker.call(() => this.callService(leastLoadedInstance.instance, servicePrefix));
        return leastLoadedInstance.instance;
      } catch (error) {
        lastError = error;
        console.error(`Service call failed for instance ${leastLoadedInstance.instance}: ${error.message}`);
        attempts++;
        await this.circuitBreaker.deregisterService();
      }
    }

    throw new Error('All service instances are unavailable');
  }
}
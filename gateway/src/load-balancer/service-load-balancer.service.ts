import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { LoadCircuitBreaker } from '../middleware/load-circuit-breaker.middleware';

@Injectable()
export class ServiceLoadBalancer {
  public circuitBreaker: LoadCircuitBreaker;

  constructor() {
    const consulHost = process.env.CONSUL_HOST || 'localhost';
    const consulPort = parseInt(process.env.CONSUL_PORT, 10) || 8500;
    const consulUrl = `http://${consulHost}:${consulPort}`;

    this.circuitBreaker = new LoadCircuitBreaker(
      3, // failureThreshold
      1, // successThreshold
      5000, // timeout in milliseconds
      consulUrl
    );
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
        return { instance, load: Infinity };
      }
    }));

    const leastLoadedInstance = instanceLoads.reduce((prev, curr) => {
      return (prev.load < curr.load) ? prev : curr;
    });

    console.log(`Least loaded instance: ${leastLoadedInstance.instance} with load ${leastLoadedInstance.load}`);
    return leastLoadedInstance.instance;
  }
}
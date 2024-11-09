import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { BaseLoadBalancerService } from './load-balancer.service';
import { ConsulService } from './consul.service';

@Injectable()
export class ServiceLoadBalancer extends BaseLoadBalancerService {
  private index = 0;

  constructor(
    private readonly consulService: ConsulService,
  ) {
    const consulHost = process.env.CONSUL_HOST || 'localhost';
    const consulPort = parseInt(process.env.CONSUL_PORT, 10) || 8500;
    const consulUrl = `http://${consulHost}:${consulPort}`;
    super(3, 2000, consulUrl); // 3 failures, 1 success, 2 seconds timeout
  }

  async getNextInstance(servicePrefix: string, serviceName: string): Promise<string> {
    const instances = await this.consulService.getServiceInstances(serviceName);

    if (instances.length === 0) {
      this.logger.error(JSON.stringify({
        "service": "gateway",
        "module": "service-load-balancer",
        "msg": `No available ${serviceName} instances`,
      }));
      throw new Error('No available service instances');
    }

    const instanceLoads = await Promise.all(instances.map(async (instance) => {
      try {
        const response = await this.circuitBreaker.call(() => axios.get(`http://${instance}/${servicePrefix}/load`));
        console.log(`Load for instance ${instance}: ${response.data.cpu_usage}`);
        return { instance, load: response.data.cpu_usage };
      } catch (error) {
        console.error(`Error fetching load for instance ${instance}: ${error.message}`);
        this.logger.error(JSON.stringify({
          "service": "gateway",
          "module": "service-load-balancer",
          "msg": `Error fetching load for instance ${instance}: ${error.message}`,
        }));
        this.circuitBreaker.serviceId = `${serviceName}-${instance.split(':')[0]}`;
        await this.circuitBreaker.deregisterService();
        return { instance, load: Infinity };
      }
    }));

    const sortedInstances = instanceLoads
      .filter(instanceLoad => instanceLoad.load !== Infinity)
      .sort((a, b) => a.load - b.load);

    if (sortedInstances.length === 0) {
      this.logger.error(JSON.stringify({
        "service": "gateway",
        "module": "service-load-balancer",
        "msg": `All ${serviceName} instances are unavailable`,
      }));
      throw new Error('No available service instances');
    }

    let attempts = 0;
    let lastError: any;

    while (attempts < 3) {
      const leastLoadedInstance = sortedInstances.shift();
      try {
        this.circuitBreaker.serviceId = `${serviceName}-${leastLoadedInstance.instance.split(':')[0]}`;
        await this.circuitBreaker.call(() => this.callService(leastLoadedInstance.instance, servicePrefix));
        return leastLoadedInstance.instance;
      } catch (error) {
        this.logger.error(JSON.stringify({
          "service": "gateway",
          "module": "service-load-balancer",
          "msg": `Service call failed for instance ${leastLoadedInstance.instance}: ${error.message}`,
        }));
        lastError = error;
        console.error(`Service call failed for instance ${leastLoadedInstance.instance}: ${error.message}`);
        attempts++;
        this.loggerInfo.info(JSON.stringify({
          "service": "gateway",
          "module": "service-load-balancer",
          "msg": `Deregistering instance ${leastLoadedInstance.instance}`,
        }));
        this.circuitBreaker.serviceId = `${serviceName}-${leastLoadedInstance.instance.split(':')[0]}`;
        const isRegistered = await this.consulService.isServiceRegistered(this.circuitBreaker.serviceId);
        if (isRegistered) {
          await this.circuitBreaker.deregisterService();
        }
        await this.circuitBreaker.resetFailures();
      }
    }
    
    this.logger.error(JSON.stringify({
      "service": "gateway",
      "module": "service-load-balancer",
      "msg": `All ${serviceName} instances are unavailable`,
    }));
    throw new Error(`All ${serviceName} instances are unavailable`);
  }
}
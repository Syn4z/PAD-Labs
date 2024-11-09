import { Injectable } from '@nestjs/common';
import { BaseLoadBalancerService } from './load-balancer.service';
import { ConsulService } from './consul.service';

@Injectable()
export class RoundRobinService extends BaseLoadBalancerService {
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
        "module": "round-robin-balancer",
        "msg": `No available ${serviceName} instances`,
      }));
      throw new Error(`No available ${serviceName} instances`);
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
        await this.logger.error(JSON.stringify({
          "service": "gateway",
          "module": "round-robin-balancer",
          "msg": `Service call failed for instance ${instance}: ${error.message}`,
        }));
        lastError = error;
        console.error(`Service call failed for instance ${instance}: ${error.message}`);
        attempts++;
        await this.loggerInfo.info(JSON.stringify({
          "service": "gateway",
          "module": "round-robin-balancer",
          "msg": `Deregistering instance ${instance}`,
        }));
        this.circuitBreaker.serviceId = `${serviceName}-${instance.split(':')[0]}`;
        const isRegistered = await this.consulService.isServiceRegistered(this.circuitBreaker.serviceId);
        if (isRegistered) {
          await this.circuitBreaker.deregisterService();
        }
        await this.circuitBreaker.resetFailures();
      }
    }

    this.logger.error(JSON.stringify({
      "service": "gateway",
      "module": "round-robin-balancer",
      "msg": `All ${serviceName} instances are unavailable`,
    }));
    throw new Error(`All ${serviceName} instances are unavailable`);
  }
}
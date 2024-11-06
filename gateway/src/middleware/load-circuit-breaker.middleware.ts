import { CircuitBreaker } from './circuit-breaker.middleware';
import axios from 'axios';

export class LoadCircuitBreaker extends CircuitBreaker {
  private readonly consulUrl: string;
  public serviceId: string;

  constructor(
    failureThreshold: number,
    timeout: number,
    consulUrl: string
  ) {
    super(failureThreshold, timeout);
    this.consulUrl = consulUrl;
  }

  protected async fail() {
    super.fail();
    if (this.state === 'OPEN') {
      await this.deregisterService();
    }
  }

  public async deregisterService() {
    try {
      console.log(`Deregistering service ${this.serviceId} from Consul`);
      await axios.put(`${this.consulUrl}/v1/agent/service/deregister/${this.serviceId}`);
      console.log(`Service ${this.serviceId} deregistered from Consul`);
    } catch (error) {
      console.error(`Failed to deregister service ${this.serviceId} from Consul: ${error.message}`);
    }
  }

  public async tryServices(instances: string[], servicePrefix: string): Promise<string> {
    let lastError: any;
    for (const instance of instances) {
      this.resetFailures();
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await this.call(() => axios.get(`http://${instance}/${servicePrefix}/status`));
          return instance;
        } catch (error) {
          lastError = error;
          this.fail();
          if (attempt < 2) {
            console.log(`Retrying service call for instance ${instance}, attempt ${attempt + 2}/3`);
          }
        }
      }
    }
    throw lastError;
  }
}
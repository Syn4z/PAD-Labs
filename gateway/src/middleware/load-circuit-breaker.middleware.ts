import { CircuitBreaker } from './circuit-breaker.middleware';
import axios from 'axios';

export class LoadCircuitBreaker extends CircuitBreaker {
  private readonly consulUrl: string;
  public serviceId: string;

  constructor(
    failureThreshold: number,
    successThreshold: number,
    timeout: number,
    consulUrl: string
  ) {
    super(failureThreshold, successThreshold, timeout);
    this.consulUrl = consulUrl;
  }

  protected async fail() {
    super.fail();
    if (this.state === 'OPEN') {
      await this.deregisterService();
    }
  }

  private async deregisterService() {
    try {
      console.log(`Deregistering service ${this.serviceId} from Consul`);
      await axios.put(`${this.consulUrl}/v1/agent/service/deregister/${this.serviceId}`);
      console.log(`Service ${this.serviceId} deregistered from Consul`);
    } catch (error) {
      console.error(`Failed to deregister service ${this.serviceId} from Consul: ${error.message}`);
    }
  }
}
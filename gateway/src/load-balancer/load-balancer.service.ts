import { LoadCircuitBreaker } from '../middleware/load-circuit-breaker.middleware';
import axios from 'axios';

export abstract class BaseLoadBalancerService {
  public circuitBreaker: LoadCircuitBreaker;

  constructor(failureThreshold: number, timeout: number, consulUrl: string) {
    this.circuitBreaker = new LoadCircuitBreaker(failureThreshold, timeout, consulUrl);
  }

  protected async callService(instance: string, servicePrefix: string): Promise<any> {
    try {
      const response = await axios.get(`http://${instance}/${servicePrefix}/status`);
      return response.data;
    } catch (error) {
      throw new Error('Service failure: ' + error.message);
    }
  }
}
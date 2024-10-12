import { CircuitBreaker } from '../middleware/circuit-breaker.middleware';
import axios from 'axios';

export abstract class BaseLoadBalancerService {
  protected circuitBreaker: CircuitBreaker;

  constructor(failureThreshold: number, successThreshold: number, timeout: number) {
    this.circuitBreaker = new CircuitBreaker(failureThreshold, successThreshold, timeout);
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
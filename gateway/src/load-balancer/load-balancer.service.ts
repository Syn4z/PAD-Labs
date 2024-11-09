import { LoadCircuitBreaker } from '../middleware/load-circuit-breaker.middleware';
import axios from 'axios';
import * as winston from 'winston';

export abstract class BaseLoadBalancerService {
  public circuitBreaker: LoadCircuitBreaker;
  protected readonly logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.Http({
        port: 6000,
        host: 'logstash',
        ssl: false,
      })
    ]
  });
  protected readonly loggerInfo = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.Http({
        port: 6000,
        host: 'logstash',
        ssl: false,
      })
    ]
  });

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
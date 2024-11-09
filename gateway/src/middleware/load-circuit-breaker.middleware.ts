import { CircuitBreaker } from './circuit-breaker.middleware';
import axios from 'axios';
import * as winston from 'winston';

export class LoadCircuitBreaker extends CircuitBreaker {
  private readonly consulUrl: string;
  public serviceId: string;
  private readonly logger = winston.createLogger({
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

  constructor(
    failureThreshold: number,
    timeout: number,
    consulUrl: string
  ) {
    super(failureThreshold, timeout);
    this.consulUrl = consulUrl;
  }

  protected async fail() {
    const wasClosed = this.state === 'CLOSED';
    super.fail();
    if (this.state === 'OPEN' && wasClosed) {
      this.logger.error(JSON.stringify({
        "service": "gateway",
        "module": "load-circuit-breaker",
        "msg": "Error: Circuit breaker is open"
      }));
      await this.deregisterService();
    }
  }

  public async deregisterService() {
    try {
      console.log(`Deregistering service ${this.serviceId} from Consul`);
      await axios.put(`${this.consulUrl}/v1/agent/service/deregister/${this.serviceId}`);
      console.log(`Service ${this.serviceId} deregistered from Consul`);
    } catch (error) {
      this.logger.error(JSON.stringify({
        "service": "gateway",
        "module": "load-circuit-breaker",
        "msg": `Failed to deregister service ${this.serviceId} from Consul: ${error.message}`
      }));
      console.error(`Failed to deregister service ${this.serviceId} from Consul: ${error.message}`);
    }
  }
}
import { Injectable } from '@nestjs/common';
import * as Consul from 'consul';

export interface ConsulServiceInstance {
    ID: string;
    Service: string;
    Address: string;
    Port: number;
  }
  
  @Injectable()
  export class ConsulService {
    private readonly consul: Consul.Consul;
  
    constructor() {
        const consulHost = process.env.CONSUL_HOST || 'localhost';
        const consulPort = parseInt(process.env.CONSUL_PORT, 10) || 8500;
        this.consul = new Consul({
            host: consulHost,
            port: consulPort,
          });
    }
  
    async getServiceInstances(serviceName: string): Promise<string[]> {
      try {
        const services = await this.consul.agent.service.list() as Record<string, ConsulServiceInstance>;
        const instances = Object.values(services)
        .filter(service => {
            const match = service.Service === serviceName;
            return match;
        })
        .map(service => `${service.Address}:${service.Port}`);
        return instances;
      } catch (err) {
        throw new Error('Error retrieving services from Consul: ' + err.message);
      }
    }
  }

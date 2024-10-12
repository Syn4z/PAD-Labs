import { Injectable } from '@nestjs/common';
import * as Consul from 'consul';
import axios from 'axios';

export interface ConsulServiceInstance {
    ID: string;
    Service: string;
    Address: string;
    Port: number;
  }
  
  @Injectable()
  export class ConsulService {
    private readonly consul: Consul.Consul;
    private readonly consulUrl: string;
  
    constructor() {
        const consulHost = process.env.CONSUL_HOST || 'localhost';
        const consulPort = parseInt(process.env.CONSUL_PORT, 10) || 8500;
        this.consulUrl = `http://${consulHost}:${consulPort}`;
        this.consul = new Consul({
            host: consulHost,
            port: consulPort,
          });
    }
    
    async getConsulStatus(): Promise<any> {
      try {
        const response = await axios.get(`${this.consulUrl}/v1/status/leader`);
        return {
          status: 'Consul is running',
          leader: response.data,
        };
      } catch (error) {
        throw new Error('Error fetching Consul status: ' + error.message);
      }
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

    async getAllServices(): Promise<Record<string, ConsulServiceInstance>> {
      try {
        const services = await this.consul.agent.service.list() as Record<string, ConsulServiceInstance>;
        return services;
      } catch (err) {
        throw new Error('Error retrieving all services from Consul: ' + err.message);
      }
    }
  }

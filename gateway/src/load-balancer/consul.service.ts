import { Injectable } from '@nestjs/common';
import * as Consul from 'consul';
import axios from 'axios';
import * as winston from 'winston';

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
        this.logger.error(JSON.stringify({
          "service": "gateway",
          "module": "consul",
          "msg": `Error: ${error.message}`,
        }));
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
        this.logger.error(JSON.stringify({
          "service": "gateway",
          "module": "consul",
          "msg": `Error: ${err.message}`,
        }));
        throw new Error('Error retrieving services from Consul: ' + err.message);
      }
    }

    async getAllServices(): Promise<Record<string, ConsulServiceInstance>> {
      try {
        const services = await this.consul.agent.service.list() as Record<string, ConsulServiceInstance>;
        return services;
      } catch (err) {
        this.logger.error(JSON.stringify({
          "service": "gateway",
          "module": "consul",
          "msg": `Error: ${err.message}`,
        }));
        throw new Error('Error retrieving all services from Consul: ' + err.message);
      }
    }

    async isServiceRegistered(serviceId: string): Promise<boolean> {
      try {
        const response = await axios.get(`${this.consulUrl}/v1/agent/service/${serviceId}`);
        return response.status === 200;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return false;
        }
        this.logger.error(JSON.stringify({
          "service": "gateway",
          "module": "consul",
          "msg": `Error checking service registration: ${error.message}`,
        }));
        throw new Error('Error checking service registration: ' + error.message);
      }
    }
  }

import { Controller, Get, Param, Res } from '@nestjs/common';
import { ConsulService } from '../load-balancer/consul.service';
import { RoundRobinService } from '../load-balancer/round-robin-balancer.service';
import { Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('gateway')
export class GatewayController {
  private readonly startTime: Date;
  constructor(
    private readonly consulService: ConsulService,
    private readonly roundRobinService: RoundRobinService,
    private readonly configService: ConfigService,
  ) {
    this.startTime = new Date();
  }

  @Get('game-store/:endpoint')
  async forwardRequest(@Param('endpoint') endpoint: string) {
    try {
      const serviceName = this.configService.get<string>('SERVICE_NAME');
      const servicePrefix = this.configService.get<string>('SERVICE_PREFIX');
      const instances = await this.consulService.getServiceInstances(serviceName);
      const instance = await this.roundRobinService.getNextInstance(instances, servicePrefix);
      const targetUrl = `http://${instance}/${servicePrefix}/${endpoint}`;

      const result = await axios.get(targetUrl);
      return result.data;
    } catch (err) {
      throw new Error('Error forwarding request: ' + err.message);
    }
  }

  @Get('status')
  async getGatewayStatus(@Res() res: Response) {
    try {
      const uptime = new Date().getTime() - this.startTime.getTime();
      const services = await this.consulService.getAllServices();
      const serviceInstances = Object.values(services).map(service => ({
        serviceName: service.Service,
        address: service.Address,
        port: service.Port,
      }));

      res.status(200).json({
        status: 'Gateway is running',
        uptime: `${Math.floor(uptime / 1000)} seconds`,
        services: serviceInstances,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching Gateway status',
        error: error.message,
      });
    }
  }

  @Get('sd-status')
  async getConsulStatus(@Res() res: Response) {
    try {
      const status = await this.consulService.getConsulStatus();
      res.status(200).json(status);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching Consul status',
        error: error.message,
      });
    }
  }
}

import { Controller, Get, Post, Put, Delete, Param, Body, Res } from '@nestjs/common';
import { ConsulService } from '../load-balancer/consul.service';
import { RoundRobinService } from '../load-balancer/round-robin-balancer.service';
import { ServiceLoadBalancer } from '../load-balancer/service-load-balancer.service';
import { Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('gateway')
export class GatewayController {
  private readonly startTime: Date;
  constructor(
    private readonly consulService: ConsulService,
    private readonly roundRobinService: RoundRobinService,
    private readonly serviceLoadBalancer: ServiceLoadBalancer,
    private readonly configService: ConfigService,
  ) {
    this.startTime = new Date();
  }

  @Get('game-store/:endpoint')
  async forwardGetRequest(@Param('endpoint') endpoint: string, @Res() res: Response) {
    return this.forwardGameRequest('GET', endpoint, res);
  }

  @Post('game-store/:endpoint')
  async forwardPostRequest(@Param('endpoint') endpoint: string, @Body() body: any, @Res() res: Response) {
    return this.forwardGameRequest('POST', endpoint, res, body);
  }

  @Put('game-store/:endpoint')
  async forwardPutRequest(@Param('endpoint') endpoint: string, @Body() body: any, @Res() res: Response) {
    return this.forwardGameRequest('PUT', endpoint, res, body);
  }

  @Delete('game-store/:endpoint')
  async forwardDeleteRequest(@Param('endpoint') endpoint: string, @Res() res: Response) {
    return this.forwardGameRequest('DELETE', endpoint, res);
  }

  @Get('auth/:endpoint')
  async forwardAuthGetRequest(@Param('endpoint') endpoint: string, @Res() res: Response) {
    return this.forwardAuthRequest('GET', endpoint, res);
  }

  @Post('auth/:endpoint')
  async forwardAuthPostRequest(@Param('endpoint') endpoint: string, @Body() body: any, @Res() res: Response) {
    return this.forwardAuthRequest('POST', endpoint, res, body);
  }

  @Put('auth/:endpoint')
  async forwardAuthPutRequest(@Param('endpoint') endpoint: string, @Body() body: any, @Res() res: Response) {
    return this.forwardAuthRequest('PUT', endpoint, res, body);
  }

  @Delete('auth/:endpoint')
  async forwardAuthDeleteRequest(@Param('endpoint') endpoint: string, @Res() res: Response) {
    return this.forwardAuthRequest('DELETE', endpoint, res);
  }

  private async forwardGameRequest(method: string, endpoint: string, res: Response, data?: any) {
    try {
      const serviceName = this.configService.get<string>('GAME_SERVICE_NAME');
      const servicePrefix = this.configService.get<string>('GAME_SERVICE_PREFIX');
      const instances = await this.consulService.getServiceInstances(serviceName);
      const instance = await this.roundRobinService.getNextInstance(instances, servicePrefix);
      if (this.roundRobinService.circuitBreaker.state === 'OPEN') {
        return res.status(503).json({ message: 'Circuit breaker is open' });
      }
  
      const targetUrl = `http://${instance}/${servicePrefix}/${endpoint}`;
      let result;
      switch (method) {
        case 'GET':
          result = await axios.get(targetUrl);
          break;
        case 'POST':
          result = await axios.post(targetUrl, data);
          break;
        case 'PUT':
          result = await axios.put(targetUrl, data);
          break;
        case 'DELETE':
          result = await axios.delete(targetUrl);
          break;
        default:
          return res.status(400).json({ message: 'Unsupported method' });
      }
      return res.status(result.status).json(result.data);
    } catch (err) {
      if (err.response) {
        return res.status(err.response.status).json({ message: err.response.statusText, data: err.response.data });
      } else {
        return res.status(500).json({ message: 'Error forwarding request', error: err.message });
      }
    }
  }

  private async forwardAuthRequest(method: string, endpoint: string, res: Response, data?: any) {
    try {
      const serviceName = this.configService.get<string>('AUTH_SERVICE_NAME');
      const servicePrefix = this.configService.get<string>('AUTH_SERVICE_PREFIX');
      const instances = await this.consulService.getServiceInstances(serviceName);
      const instance = await this.serviceLoadBalancer.getNextInstance(instances, servicePrefix, serviceName);
      if (this.serviceLoadBalancer.circuitBreaker.state === 'OPEN') {
        return res.status(503).json({ message: 'Circuit breaker is open' });
      }

      const targetUrl = `http://${instance}/${servicePrefix}/${endpoint}`;
      let result;
      switch (method) {
        case 'GET':
          result = await axios.get(targetUrl);
          break;
        case 'POST':
          result = await axios.post(targetUrl, data);
          break;
        case 'PUT':
          result = await axios.put(targetUrl, data);
          break;
        case 'DELETE':
          result = await axios.delete(targetUrl);
          break;
        default:
          return res.status(400).json({ message: 'Unsupported method' });
      }
      return res.status(result.status).json(result.data);
    } catch (err) {
      if (err.response) {
        return res.status(err.response.status).json({ message: err.response.statusText, data: err.response.data });
      } else {
        return res.status(500).json({ message: 'Error forwarding request', error: err.message });
      }
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

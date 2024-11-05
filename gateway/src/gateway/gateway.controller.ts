import { Controller, Get, Post, Put, Delete, Param, Body, Res } from '@nestjs/common';
import { ConsulService } from '../load-balancer/consul.service';
import { RoundRobinService } from '../load-balancer/round-robin-balancer.service';
import { ServiceLoadBalancer } from '../load-balancer/service-load-balancer.service';
import { Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { GrpcMethod } from '@nestjs/microservices';
import { mapHttpToGrpcStatus } from '../grpc/http-to-grpc';
import { BuyGameResponse } from '../grpc/game-store.interface';

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

  @GrpcMethod('GameStore', 'BuyGame')
  async buyGame(data: any, callback: (response: BuyGameResponse) => void): Promise<void> {
    try {
      const endpoint = 'add_game';
      const body = {
        game_title: data.gameTitle,
        username: data.username,
      };
      const res = await this.forwardAuthRequest('POST', endpoint, body);
      const grpcStatus = mapHttpToGrpcStatus(res.status);
      const response: BuyGameResponse = { message: res.data, status_code: grpcStatus };
      callback(response);
    } catch (error) {
      const grpcStatus = mapHttpToGrpcStatus(error.response?.status || 500);
      const response: BuyGameResponse = { message: error.message, status_code: grpcStatus };
      callback(response);
    }
  }

  @Delete('game-store/:endpoint')
  async forwardDeleteRequest(@Param('endpoint') endpoint: string, @Res() res: Response) {
    return this.forwardGameRequest('DELETE', endpoint, res);
  }

  @Get('auth/:endpoint')
  async forwardAuthGetRequest(@Param('endpoint') endpoint: string) {
    return this.forwardAuthRequest('GET', endpoint);
  }

  @Post('auth/:endpoint')
  async forwardAuthPostRequest(@Param('endpoint') endpoint: string, @Body() body: any) {
    return this.forwardAuthRequest('POST', endpoint, body);
  }

  @Put('auth/:endpoint')
  async forwardAuthPutRequest(@Param('endpoint') endpoint: string, @Body() body: any) {
    return this.forwardAuthRequest('PUT', endpoint, body);
  }

  @Delete('auth/:endpoint')
  async forwardAuthDeleteRequest(@Param('endpoint') endpoint: string) {
    return this.forwardAuthRequest('DELETE', endpoint);
  }

  private async forwardGameRequest(method: string, endpoint: string, res: Response, data?: any) {
    try {
      const serviceName = this.configService.get<string>('GAME_SERVICE_NAME');
      const servicePrefix = this.configService.get<string>('GAME_SERVICE_PREFIX');
      const instances = await this.consulService.getServiceInstances(serviceName);
      const instance = await this.roundRobinService.getNextInstance(instances, servicePrefix, serviceName);
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
        return res.status(err.response.status).json({ data: err.response.data });
      } else {
        return res.status(500).json({ message: 'Error forwarding request', error: err.message });
      }
    }
  }

  private async forwardAuthRequest(method: string, endpoint: string, data?: any) {
    try {
      const serviceName = this.configService.get<string>('AUTH_SERVICE_NAME');
      const servicePrefix = this.configService.get<string>('AUTH_SERVICE_PREFIX');
      const instances = await this.consulService.getServiceInstances(serviceName);

      let instance;
      let attempts = 0;
      while (attempts <= 3) {
        try {
          instance = await this.serviceLoadBalancer.getNextInstance(instances, servicePrefix, serviceName);
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
              return { status: 400, data: { message: 'Unsupported method' } };
          }
          return { status: result.status, data: result.data };
        } catch (error) {
          console.error(`Service call failed for instance ${instance}: ${error.message}`);
          attempts++;
          if (attempts >= 3) {
            return { status: 503, data: { message: 'All service instances are unavailable' } };
          }
        }
      }
    } catch (err) {
      if (err.response) {
        return { status: err.response.status, data: err.response.data };
      } else {
        return { status: 500, data: { message: 'Error forwarding request', error: err.message } };
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

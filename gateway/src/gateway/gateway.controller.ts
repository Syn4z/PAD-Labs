import { Controller, Get, Post, Put, Delete, Param, Body, Res } from '@nestjs/common';
import { ConsulService } from '../load-balancer/consul.service';
import { RoundRobinService } from '../load-balancer/round-robin-balancer.service';
import { ServiceLoadBalancer } from '../load-balancer/service-load-balancer.service';
import { Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { BuyGameResponse } from '../grpc/game-store.interface';
import { status } from '@grpc/grpc-js';

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

  @GrpcMethod('GameStore', 'BuyGame')
  async buyGame(data: any): Promise<BuyGameResponse> {
    const body = {
      game_title: data.gameTitle,
      username: data.username,
    };
    try {
      await this.forwardAuthRequest('POST', 'add_game', null, body);
      return {
        message: `Game ${data.gameTitle} added to ${data.username} profile`,
        status_code: 200,
      };
    } catch (error) {
      console.error('Error in handleAuthRequest:', error);
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: error.error || 'An internal server error occurred.',
      });
    }
  }

  @Get('auth/:endpoint')
  async forwardAuthGetRequest(@Param('endpoint') endpoint: string, @Res() res: Response) {
    return this.forwardAuthRequest('GET', endpoint, res);
  }

  @Post('auth/:endpoint')
  async forwardAuthPostRequest(@Param('endpoint') endpoint: string, @Res() res: Response, @Body() body: any) {
    return this.forwardAuthRequest('POST', endpoint, res, body);
  }

  @Put('auth/:endpoint')
  async forwardAuthPutRequest(@Param('endpoint') endpoint: string, @Res() res: Response, @Body() body: any) {
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
      const instance = await this.roundRobinService.getNextInstance(servicePrefix, serviceName);
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

  private async forwardAuthRequest(method: string, endpoint: string, res?: Response, data?: any) {
    try {
      const serviceName = this.configService.get<string>('AUTH_SERVICE_NAME');
      const servicePrefix = this.configService.get<string>('AUTH_SERVICE_PREFIX');
      const instance = await this.serviceLoadBalancer.getNextInstance(servicePrefix, serviceName);
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
          if (res) {
            return res.status(400).json({ message: 'Unsupported method' });
          } else {
            throw new Error('Unsupported method');
          }
      }
  
      if (res) {
        return res.status(result.status).json(result.data);
      } else {
        return result.data;
      }
    } catch (err) {
      if (res) {
        if (err.response) {
          return res.status(err.response.status).json({ data: err.response.data });
        } else {
          return res.status(500).json({ message: 'Error forwarding request', error: err.message });
        }
      } else {
        throw err.response ? err.response.data : new Error('Error forwarding request: ' + err.message);
      }
    }
  }  

  @Put('api/update-username')
  async updateUsername(@Body() body: any, @Res() res: Response) {
    const { new_username, user_id } = body;
    if (!new_username || user_id == null) {
      return res.status(400).json({ message: 'Invalid request: missing parameters' });
    }

    if (typeof new_username !== 'string' || new_username.length < 3) {
      return res.status(400).json({ message: 'New username must be a string with at least 3 characters' });
    }

    if (typeof user_id !== 'number' || !Number.isInteger(user_id)) {
      return res.status(400).json({ message: 'User ID must be an integer' });
    }

    const authInstance = await this.serviceLoadBalancer.getNextInstance('users', 'auth-service');
    const authUrl = `http://${authInstance}/users`;
    const gameStoreInstance = await this.roundRobinService.getNextInstance('games', 'game-store-service');
    const gameStoreUrl = `http://${gameStoreInstance}/games`;

    try {
      if (!authUrl || !gameStoreUrl) {
        return res.status(500).json({ message: 'No services available' });
      }

      let old_username;
      try {
        const response = await axios.get(`${authUrl}/${user_id}`);
        old_username = response.data.username;
      } catch (error) {
        if (error.response && error.response.status) {
          return res.status(error.response.status).json({ message: error.response.data.message });
        } else {
          throw error;
        }
      }

      if (old_username === new_username) {
        return res.status(400).json({ message: 'New username must be different' });
      }

      // Phase 1: Prepare
      const authPrepareResponse = await axios.put(
        `${authUrl}/prepare_update_username/${user_id}`,
        { new_username },
        { timeout: 5000 }
      );
      const gamePrepareResponse = await axios.put(
        `${gameStoreUrl}/prepare_update_username`,
        { old_username, new_username },
        { timeout: 5000 }
      );

      if (authPrepareResponse.data.status !== 'OK' || gamePrepareResponse.data.status !== 'OK') {
        throw new Error('Prepare phase failed');
      }

      // Phase 2: Commit
      await axios.put(`${authUrl}/commit_update_username/${user_id}`, { timeout: 5000 });
      await axios.put(`${gameStoreUrl}/commit_update_username`, { timeout: 5000 });

      res.status(200).json({ message: 'Username updated successfully' });
    } catch (error) {
      // Abort if any step fails
      await axios.put(`${authUrl}/abort_update_username/${user_id}`, { timeout: 5000 });
      await axios.put(`${gameStoreUrl}/abort_update_username`, { timeout: 5000 });
      res.status(500).json({ message: 'Failed to update username', error: error.message });
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

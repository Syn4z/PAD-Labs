import { Controller, Get, Param, Res } from '@nestjs/common';
import { ConsulService } from '../load-balancer/consul.service';
import { RoundRobinService } from '../load-balancer/load-balancer.service';
import { Response } from 'express';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('gateway')
export class GatewayController {
  constructor(
    private readonly consulService: ConsulService,
    private readonly roundRobinService: RoundRobinService,
    private readonly configService: ConfigService,
  ) {}

  @Get('game-store/:endpoint')
  async forwardRequest(
    @Param('endpoint') endpoint: string,
    @Res() res: Response,
  ) {
    try {
      const serviceName = this.configService.get<string>('SERVICE_NAME');
      const servicePrefix = this.configService.get<string>('SERVICE_PREFIX');
      const instances = await this.consulService.getServiceInstances(serviceName);
      const instance = this.roundRobinService.getNextInstance(instances);
      const targetUrl = `http://${instance}/${servicePrefix}/${endpoint}`;
      console.log(`Forwarding request to ${targetUrl}`);

      const result = await axios.get(targetUrl);
      res.status(result.status).send(result.data);
    } catch (err) {
      res.status(500).send('Error forwarding request: ' + err.message);
    }
  }
}

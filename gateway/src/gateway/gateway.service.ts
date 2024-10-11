// src/gateway.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';

@Injectable()
export class GatewayService {
  constructor(private readonly httpService: HttpService) {}

  redirectToGameStoreService(instance: any, endpoint: string, method: string, data?: any): Observable<any> {
    const url = `http://${instance.Address}:${instance.Port}/${endpoint}`;
    switch (method) {
      case 'GET':
        return this.httpService.get(url);
      case 'POST':
        return this.httpService.post(url, data);
      case 'PUT':
        return this.httpService.put(url, data);
      case 'DELETE':
        return this.httpService.delete(url);
      default:
        throw new Error('Unsupported method');
    }
  }
}
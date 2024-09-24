import { Controller, Get, Post, Put, Delete, Param, Body, Headers } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  getStatus(): string {
    return this.gatewayService.getStatus();
  }

  @Get('auth/:endpoint')
  getFromAuthService(@Param('endpoint') endpoint: string, @Headers() headers: any): Observable<any> {
    return this.gatewayService.redirectToAuthService(endpoint, 'GET', null, headers).pipe(
      map(response => response.data)
    );
  }

  @Post('auth/:endpoint')
  postToAuthService(@Param('endpoint') endpoint: string, @Body() data: any): Observable<any> {
    return this.gatewayService.redirectToAuthService(endpoint, 'POST', data).pipe(
      map(response => response.data)
    );
  }

  @Put('auth/:endpoint')
  putToAuthService(@Param('endpoint') endpoint: string, @Body() data: any): Observable<any> {
    return this.gatewayService.redirectToAuthService(endpoint, 'PUT', data).pipe(
      map(response => response.data)
    );
  }

  @Delete('auth/:endpoint')
  deleteFromAuthService(@Param('endpoint') endpoint: string): Observable<any> {
    return this.gatewayService.redirectToAuthService(endpoint, 'DELETE').pipe(
      map(response => response.data)
    );
  }

  @Get('game-store/:endpoint')
  getFromGameStoreService(@Param('endpoint') endpoint: string): Observable<any> {
    return this.gatewayService.redirectToGameStoreService(endpoint, 'GET').pipe(
      map(response => response.data)
    );
  }

  @Post('game-store/:endpoint')
  postToGameStoreService(@Param('endpoint') endpoint: string, @Body() data: any): Observable<any> {
    return this.gatewayService.redirectToGameStoreService(endpoint, 'POST', data).pipe(
      map(response => response.data)
    );
  }

  @Put('game-store/:endpoint')
  putToGameStoreService(@Param('endpoint') endpoint: string, @Body() data: any): Observable<any> {
    return this.gatewayService.redirectToGameStoreService(endpoint, 'PUT', data).pipe(
      map(response => response.data)
    );
  }

  @Delete('game-store/:endpoint')
  deleteFromGameStoreService(@Param('endpoint') endpoint: string): Observable<any> {
    return this.gatewayService.redirectToGameStoreService(endpoint, 'DELETE').pipe(
      map(response => response.data)
    );
  }
}

import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class GatewayService {
  constructor(private readonly httpService: HttpService) {}

  getStatus(): string {
    return 'Gateway is running';
  }

  redirectToAuthService(endpoint: string, method: string, data?: any): Observable<any> {
    const url = `http://auth-service:5000/users/${endpoint}`;
    return this.httpService.request({ url, method, data }).pipe(
      map((response: AxiosResponse) => ({
        statusCode: response.status,
        statusMessage: response.statusText,
        data: response.data,
      })),
      catchError(err => {
        const errorMessage = err.response?.data?.error || 'An error occurred';
        const statusCode = err.response?.status || 500;
        return throwError(() => new HttpException({ error: errorMessage }, statusCode));
      })
    );
  }

  redirectToGameStoreService(endpoint: string, method: string, data?: any): Observable<any> {
    const url = `http://game-store-service:5000/games/${endpoint}`;
    return this.httpService.request({ url, method, data }).pipe(
      map((response: AxiosResponse) => ({
        statusCode: response.status,
        statusMessage: response.statusText,
        data: response.data,
      })),
      catchError(err => {
        const errorMessage = err.response?.data?.error || 'An error occurred';
        const statusCode = err.response?.status || 500;
        return throwError(() => new HttpException({ error: errorMessage }, statusCode));
      })
    );
  }
}

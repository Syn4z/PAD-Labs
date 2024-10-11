// // src/proxy/proxy.service.ts
// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import { createProxyMiddleware } from 'http-proxy-middleware';
// import { ConsulService } from '../load-balancer/consul.service';

// @Injectable()
// export class ProxyService implements NestMiddleware {
//   constructor(private readonly consulService: ConsulService) {}

//   async use(req: Request, res: Response, next: NextFunction) {
//     await this.consulService.fetchUserServiceUrls();
//     const userServiceProxy = createProxyMiddleware({
//       target: this.consulService.getNextUserServiceUrl(),
//       changeOrigin: true,
//       router: () => this.consulService.getNextUserServiceUrl(),
//     });

//     const gameServiceProxy = createProxyMiddleware({
//       target: 'http://game:5111',
//       changeOrigin: true,
//     });

//     if (req.path.startsWith('/users')) {
//       userServiceProxy(req, res, next);
//     } else if (req.path.startsWith('/lobby') || req.path.startsWith('/games')) {
//       gameServiceProxy(req, res, next);
//     } else {
//       next();
//     }
//   }
// }
// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import rateLimit from 'express-rate-limit';

// @Injectable()
// export class RateLimitMiddleware implements NestMiddleware {
//   use(req: Request, res: Response, next: NextFunction) {
//     const usersLimiter = rateLimit({
//       windowMs: 15 * 60 * 1000, // 15 minutes
//       max: 100, // Limit each IP to 100 requests every 15 minutes
//       message: {
//         status: 429,
//         message: 'Too many requests to users service. Please try again later.',
//       },
//     });

//     const gamesLimiter = rateLimit({
//       windowMs: 15 * 60 * 1000, // 15 minutes
//       max: 100, // Limit each IP to 100 requests every 15 minutes
//       message: {
//         status: 429,
//         message: 'Too many requests to games service. Please try again later.',
//       },
//     });

//     if (req.path.startsWith('/users')) {
//       usersLimiter(req, res, next);
//     } else if (req.path.startsWith('/lobby') || req.path.startsWith('/games')) {
//       gamesLimiter(req, res, next);
//     } else {
//       next();
//     }
//   }
// }

// // src/middleware/timeout.middleware.ts
// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import * as timeout from 'connect-timeout';

// @Injectable()
// export class TimeoutMiddleware implements NestMiddleware {
//   use(req: Request, res: Response, next: NextFunction) {
//     timeout('3s')(req, res, next);
//   }
// }
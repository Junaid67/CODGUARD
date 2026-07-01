import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Ensures the raw request body is available as `req.rawBody` for HMAC webhook
 * verification (WebhookHmacGuard).
 *
 * NestFactory.create(AppModule, { rawBody: true }) (see main.ts) already
 * populates `req.rawBody` for parsed content types. This middleware is a
 * defensive fallback that buffers the raw stream on webhook routes where the
 * body may otherwise be consumed before the guard runs.
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (req.rawBody && req.rawBody.length > 0) {
      return next();
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      if (chunks.length > 0) {
        req.rawBody = Buffer.concat(chunks);
      }
      next();
    });
    req.on('error', () => next());
  }
}

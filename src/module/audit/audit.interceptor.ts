import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { METADATA_KEYS } from '../../app.constants';

/**
 * Automatically writes an audit record for any handler decorated with
 * @Audit(action). Logs SUCCESS on completion and FAILED (with error) on throw,
 * each with full request context and the handler duration. Handlers without
 * @Audit() are ignored. Registered globally as APP_INTERCEPTOR by AuditModule.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(
      METADATA_KEYS.AUDIT_ACTION,
      [context.getHandler(), context.getClass()],
    );

    // Only audit explicitly-annotated handlers.
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const auditContext = AuditService.buildContext(request);
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          void this.auditService.logSuccess(action, auditContext, {
            durationMs: Date.now() - start,
          });
        },
        error: (err) => {
          void this.auditService.logFailure(action, auditContext, err, {
            durationMs: Date.now() - start,
          });
        },
      }),
    );
  }
}

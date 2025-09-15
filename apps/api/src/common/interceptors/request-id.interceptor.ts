import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<any>();
    const res = context.switchToHttp().getResponse<any>();

    const headerId = (req.headers['x-request-id'] as string) || undefined;
    const requestId = headerId || (req as any).id || randomUUID();

    (req as any).requestId = requestId;
    res.header('x-request-id', requestId);

    return next.handle();
  }
}

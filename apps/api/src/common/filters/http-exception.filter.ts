import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<any>();
    const res = ctx.getResponse<any>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Internal server error';

    const payload: Record<string, any> = {
      statusCode: status,
      error: HttpStatus[status],
      message,
      path: req.url,
      method: req.method,
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
    };

    // Include validation / Prisma details if available
    if (exception instanceof HttpException) {
      const response = exception.getResponse() as any;
      if (response && typeof response === 'object') {
        payload.details = response.message ?? response;
      }
    } else if (typeof exception === 'object' && exception !== null) {
      const anyEx = exception as any;
      if (anyEx.code && anyEx.meta) {
        payload.details = { code: anyEx.code, meta: anyEx.meta };
      }
    }

    res.status(status).send(payload);
  }
}

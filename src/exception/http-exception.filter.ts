import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const resExcep = exception.getResponse();
    const status = exception.getStatus();
    this.logger.error(resExcep);
    response.status(status).json({
      statusCode: status,
      timeStamp: new Date().toISOString(),
      path: request.url,
      message: resExcep['message'],
    });
  }
}

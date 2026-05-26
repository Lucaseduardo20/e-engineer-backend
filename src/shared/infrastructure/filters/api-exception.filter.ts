import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

function normalizeDetails(response: string | object): unknown {
  if (typeof response === 'string') {
    return undefined;
  }

  return response;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : exception instanceof Error
          ? exception.message
          : 'Unexpected error.';

    response.status(status).json({
      code:
        exception instanceof HttpException
          ? exception.constructor.name
          : 'InternalServerError',
      message: Array.isArray(message) ? message.join('; ') : String(message),
      details: exceptionResponse
        ? normalizeDetails(exceptionResponse)
        : undefined,
    });
  }
}

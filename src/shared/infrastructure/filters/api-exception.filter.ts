import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
    const exceptionBody = isRecord(exceptionResponse)
      ? exceptionResponse
      : undefined;
    const message =
      exceptionBody && 'message' in exceptionBody
        ? exceptionBody.message
        : exception instanceof Error
          ? exception.message
          : 'Unexpected error.';
    const code =
      exceptionBody && typeof exceptionBody.code === 'string'
        ? exceptionBody.code
        : exception instanceof HttpException
          ? exception.constructor.name
          : 'InternalServerError';
    const details =
      exceptionBody && 'details' in exceptionBody
        ? exceptionBody.details
        : exceptionResponse
          ? normalizeDetails(exceptionResponse)
          : undefined;

    response.status(status).json({
      code,
      message: Array.isArray(message) ? message.join('; ') : String(message),
      details,
    });
  }
}

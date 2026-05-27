import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface ValidationErrorDetail {
  field: string;
  messages: string[];
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const ownErrors = error.constraints
      ? [
          {
            field,
            messages: Object.values(error.constraints),
          },
        ]
      : [];
    const childErrors = error.children?.length
      ? flattenValidationErrors(error.children, field)
      : [];

    return [...ownErrors, ...childErrors];
  });
}

export function createGlobalValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        code: 'ValidationError',
        message: 'Validation failed.',
        details: flattenValidationErrors(errors),
      }),
  });
}

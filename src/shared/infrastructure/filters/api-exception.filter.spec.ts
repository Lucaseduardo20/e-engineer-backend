import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

function createHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;

  return { host, json, status };
}

describe('ApiExceptionFilter', () => {
  it('preserves normalized exception code, message and details', () => {
    const { host, json, status } = createHost();
    const filter = new ApiExceptionFilter();

    filter.catch(
      new BadRequestException({
        code: 'ValidationError',
        message: 'Validation failed.',
        details: [{ field: 'name', messages: ['name should not be empty'] }],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: 'ValidationError',
      message: 'Validation failed.',
      details: [{ field: 'name', messages: ['name should not be empty'] }],
    });
  });

  it('normalizes unexpected errors', () => {
    const { host, json, status } = createHost();
    const filter = new ApiExceptionFilter();

    filter.catch(new Error('Database unavailable.'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: 'InternalServerError',
      message: 'Database unavailable.',
      details: undefined,
    });
  });
});

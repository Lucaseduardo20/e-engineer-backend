import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ApiExceptionFilter } from '../src/shared/infrastructure/filters/api-exception.filter';
import { createGlobalValidationPipe } from '../src/shared/presentation/create-global-validation-pipe';
import { CreateProjectRequestDto } from '../src/modules/projects/presentation/dto/create-project.request.dto';

@Controller('validation-test/projects')
class ValidationTestController {
  @Post()
  create(@Body() body: CreateProjectRequestDto): {
    data: CreateProjectRequestDto;
  } {
    return { data: body };
  }
}

describe('Global ValidationPipe (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ValidationTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects invalid body payloads with normalized validation details', async () => {
    const response = await request(app.getHttpServer())
      .post('/validation-test/projects')
      .send({
        name: '',
        unexpected: 'field',
      })
      .expect(400);

    expect(response.body).toEqual({
      code: 'ValidationError',
      message: 'Validation failed.',
      details: expect.arrayContaining([
        expect.objectContaining({
          field: 'name',
          messages: expect.arrayContaining(['name should not be empty']),
        }),
        expect.objectContaining({
          field: 'projectType',
          messages: expect.arrayContaining(['projectType should not be empty']),
        }),
        expect.objectContaining({
          field: 'unexpected',
          messages: expect.arrayContaining([
            'property unexpected should not exist',
          ]),
        }),
      ]),
    });
  });

  it('accepts valid body payloads', async () => {
    await request(app.getHttpServer())
      .post('/validation-test/projects')
      .send({
        name: 'Ponte Rio Norte',
        projectType: 'structural',
      })
      .expect(201)
      .expect({
        data: {
          name: 'Ponte Rio Norte',
          projectType: 'structural',
        },
      });
  });
});

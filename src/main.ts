import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './shared/infrastructure/filters/api-exception.filter';
import { createGlobalValidationPipe } from './shared/presentation/create-global-validation-pipe';

function parseCorsOrigins(value?: string): string[] {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174'];

  if (!value) {
    return defaultOrigins;
  }

  const configuredOrigins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port =
    configService.get<number>('APP_PORT') ??
    configService.getOrThrow<number>('PORT');
  const corsOrigins = parseCorsOrigins(
    configService.get<string>('CORS_ORIGINS'),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(createGlobalValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Engineer API')
    .setDescription('Contratos REST do dashboard E-Engineer.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs/api', app, swaggerDocument);

  await app.listen(port);
}
void bootstrap();

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

function getRuntimeSourcePattern(): { root: string; extension: string } {
  const isTsRuntime = __filename.endsWith('.ts');

  return {
    root: isTsRuntime ? 'src' : 'dist',
    extension: isTsRuntime ? 'ts' : 'js',
  };
}

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const sourcePattern = getRuntimeSourcePattern();

  return {
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST'),
    port: configService.getOrThrow<number>('DB_PORT'),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),
    autoLoadEntities: true,
    synchronize: configService.getOrThrow<boolean>('DB_SYNCHRONIZE'),
    migrations: [
      join(
        process.cwd(),
        `${sourcePattern.root}/**/migrations/*.${sourcePattern.extension}`,
      ),
    ],
    migrationsRun: configService.getOrThrow<boolean>('DB_MIGRATIONS_RUN'),
    logging: configService.getOrThrow<boolean>('DB_LOGGING'),
  };
}

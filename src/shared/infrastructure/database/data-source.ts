import 'reflect-metadata';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

function loadLocalEnv(): void {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const envFile = readFileSync(envPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    process.env[name] ??= value;
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getNumberEnv(name: string): number {
  const value = Number(getRequiredEnv(name));

  if (!Number.isInteger(value)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }

  return value;
}

loadLocalEnv();

const isTsRuntime = __filename.endsWith('.ts');
const sourceRoot = isTsRuntime ? 'src' : 'dist';
const sourceExtension = isTsRuntime ? 'ts' : 'js';

export default new DataSource({
  type: 'postgres',
  host: getRequiredEnv('DB_HOST'),
  port: getNumberEnv('DB_PORT'),
  username: getRequiredEnv('DB_USERNAME'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_DATABASE'),
  entities: [
    join(process.cwd(), `${sourceRoot}/**/*.orm-entity.${sourceExtension}`),
  ],
  migrations: [
    join(process.cwd(), `${sourceRoot}/**/migrations/*.${sourceExtension}`),
  ],
  synchronize: false,
  migrationsRun: false,
});

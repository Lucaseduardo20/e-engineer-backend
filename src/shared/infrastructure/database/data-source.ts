import 'reflect-metadata';
import { DataSource } from 'typeorm';

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

export default new DataSource({
  type: 'postgres',
  host: getRequiredEnv('DB_HOST'),
  port: getNumberEnv('DB_PORT'),
  username: getRequiredEnv('DB_USERNAME'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_DATABASE'),
  entities: ['dist/**/*.orm-entity.js'],
  migrations: ['dist/**/migrations/*.js'],
  synchronize: false,
});

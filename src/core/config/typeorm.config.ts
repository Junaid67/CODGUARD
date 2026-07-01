import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './typeorm-naming.strategy';

dotenvConfig({ path: '.env' });

/**
 * Single source of truth for PostgreSQL connection options. Supports either a
 * Railway-style DATABASE_URL or discrete DB_* vars. Used both by the NestJS
 * TypeOrmModule (DatabaseModule, step 3) and the migration CLI (DataSource
 * export below).
 *
 * NEVER set synchronize: true — all schema changes go through migrations.
 */
const useUrl = !!process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';

export const typeOrmConfig: TypeOrmModuleOptions & DataSourceOptions = {
  type: 'postgres',
  ...(useUrl
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        database: process.env.DB_NAME,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      }),
  // Glob the compiled or source entities/migrations depending on runtime.
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../database/migrations/*{.ts,.js}'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: !isProduction,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

// DataSource instance consumed by the TypeORM CLI (see package.json scripts).
const dataSource = new DataSource(typeOrmConfig);
export default dataSource;

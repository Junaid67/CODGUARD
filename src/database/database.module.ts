import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../core/config';

/**
 * Establishes the PostgreSQL connection using the shared typeOrmConfig (the
 * same options the migration CLI uses). Entities are discovered via glob;
 * schema changes are applied exclusively through migrations (synchronize:false).
 */
@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig)],
})
export class DatabaseModule {}

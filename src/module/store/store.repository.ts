import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StoreEntity } from './entity/store.entity';

/**
 * Data-access for stores. Extends TypeORM's Repository so all standard methods
 * are available, plus domain-specific helpers.
 */
@Injectable()
export class StoreRepository extends Repository<StoreEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StoreEntity, dataSource.createEntityManager());
  }

  findByDomain(shopDomain: string): Promise<StoreEntity | null> {
    return this.findOne({ where: { shopDomain } });
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BillingEntity } from './entity/billing.entity';

@Injectable()
export class BillingRepository extends Repository<BillingEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(BillingEntity, dataSource.createEntityManager());
  }

  /** Most recent billing record for a store. */
  findLatestByShop(shopDomain: string): Promise<BillingEntity | null> {
    return this.findOne({
      where: { shopDomain },
      order: { createdAt: 'DESC' },
    });
  }
}

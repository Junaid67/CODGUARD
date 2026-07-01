import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { OrderRecordEntity } from './entity/order-record.entity';
import { OrdersFilterDto } from './dto/orders-filter.dto';

@Injectable()
export class OrdersRepository extends Repository<OrderRecordEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(OrderRecordEntity, dataSource.createEntityManager());
  }

  findByShopAndOrderId(
    shopDomain: string,
    shopifyOrderId: string,
  ): Promise<OrderRecordEntity | null> {
    return this.findOne({ where: { shopDomain, shopifyOrderId } });
  }

  /** Finds records belonging to a store by their (UUID) ids — store-scoped. */
  findByIdsForShop(
    shopDomain: string,
    ids: string[],
  ): Promise<OrderRecordEntity[]> {
    return this.find({ where: { shopDomain, id: In(ids) } });
  }

  /** Manually-added RTO entries (Settings page), most recent first. */
  findManualForShop(shopDomain: string): Promise<OrderRecordEntity[]> {
    return this.find({
      where: { shopDomain, isManual: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** Paginated, filtered listing for the dashboard — always scoped to one store. */
  async findForDashboard(
    shopDomain: string,
    filter: OrdersFilterDto,
  ): Promise<[OrderRecordEntity[], number]> {
    const qb = this.createQueryBuilder('o').where('o.shop_domain = :shopDomain', {
      shopDomain,
    });

    if (filter.riskLevel) {
      qb.andWhere('o.risk_level = :riskLevel', { riskLevel: filter.riskLevel });
    }
    if (filter.outcome) {
      qb.andWhere('o.outcome = :outcome', { outcome: filter.outcome });
    }
    if (filter.dateFrom) {
      qb.andWhere('o.shopify_created_at >= :dateFrom', {
        dateFrom: filter.dateFrom,
      });
    }
    if (filter.dateTo) {
      qb.andWhere('o.shopify_created_at <= :dateTo', { dateTo: filter.dateTo });
    }
    if (filter.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('o.customer_name ILIKE :s', { s: `%${filter.search}%` })
            .orWhere('o.order_number ILIKE :s', { s: `%${filter.search}%` });
        }),
      );
    }

    return qb
      .orderBy('o.shopify_created_at', 'DESC')
      .skip(filter.skip)
      .take(filter.limit)
      .getManyAndCount();
  }
}

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

  /**
   * Aggregated dashboard overview counts for one store. Manual entries are
   * excluded — they are merchant-entered phone flags, not real orders.
   */
  async getStats(shopDomain: string): Promise<{
    totalOrders: number;
    pending: number;
    delivered: number;
    rto: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    unknownRisk: number;
    rtoLossPrevented: number;
  }> {
    const raw = await this.createQueryBuilder('o')
      .select('COUNT(*)', 'totalOrders')
      .addSelect(`SUM(CASE WHEN o.outcome = 'PENDING' THEN 1 ELSE 0 END)`, 'pending')
      .addSelect(`SUM(CASE WHEN o.outcome = 'DELIVERED' THEN 1 ELSE 0 END)`, 'delivered')
      .addSelect(`SUM(CASE WHEN o.outcome = 'RTO' THEN 1 ELSE 0 END)`, 'rto')
      .addSelect(`SUM(CASE WHEN o.risk_level = 'high' THEN 1 ELSE 0 END)`, 'highRisk')
      .addSelect(`SUM(CASE WHEN o.risk_level = 'medium' THEN 1 ELSE 0 END)`, 'mediumRisk')
      .addSelect(`SUM(CASE WHEN o.risk_level = 'low' THEN 1 ELSE 0 END)`, 'lowRisk')
      .addSelect(`SUM(CASE WHEN o.risk_level = 'unknown' THEN 1 ELSE 0 END)`, 'unknownRisk')
      .addSelect(
        `COALESCE(SUM(CASE WHEN o.risk_level = 'high' AND o.outcome = 'RTO' THEN o.order_total ELSE 0 END), 0)`,
        'rtoLossPrevented',
      )
      .where('o.shop_domain = :shopDomain', { shopDomain })
      .andWhere('o.is_manual = false')
      .getRawOne<Record<string, string>>();

    const num = (key: string): number => Number(raw?.[key] ?? 0);
    return {
      totalOrders: num('totalOrders'),
      pending: num('pending'),
      delivered: num('delivered'),
      rto: num('rto'),
      highRisk: num('highRisk'),
      mediumRisk: num('mediumRisk'),
      lowRisk: num('lowRisk'),
      unknownRisk: num('unknownRisk'),
      rtoLossPrevented: num('rtoLossPrevented'),
    };
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

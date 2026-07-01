import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PhoneProfileEntity } from './entity/phone-profile.entity';

/**
 * Data-access for the shared cross-store phone risk database. Lookups are by
 * phone_hash only (the raw number is never queried).
 */
@Injectable()
export class PhoneProfileRepository extends Repository<PhoneProfileEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(PhoneProfileEntity, dataSource.createEntityManager());
  }

  findByHash(phoneHash: string): Promise<PhoneProfileEntity | null> {
    return this.findOne({ where: { phoneHash } });
  }
}

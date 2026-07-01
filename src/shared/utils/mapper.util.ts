import { ClassConstructor, plainToInstance } from 'class-transformer';

/**
 * Converts entities/plain objects into response DTOs. Response DTOs use
 * @Expose() on the fields they want surfaced; everything else is stripped
 * (excludeExtraneousValues) so internal columns never leak to clients.
 */
export class MapperUtil {
  static map<T, V>(cls: ClassConstructor<T>, plain: V): T {
    return plainToInstance(cls, plain, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  static mapArray<T, V>(cls: ClassConstructor<T>, plain: V[]): T[] {
    return plain.map((item) => MapperUtil.map(cls, item));
  }
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RtoSignalEnum } from '../../../shared/enums';

/**
 * Update a store's RTO detection configuration. Both fields optional — only
 * provided fields are changed.
 */
export class UpdateStoreSettingsDto {
  @ApiPropertyOptional({
    enum: RtoSignalEnum,
    isArray: true,
    example: [RtoSignalEnum.CANCELLED, RtoSignalEnum.TAG, RtoSignalEnum.REFUNDED],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(RtoSignalEnum, { each: true })
  rtoSignals?: RtoSignalEnum[];

  @ApiPropertyOptional({
    type: [String],
    example: ['rto', 'returned', 'wapas', 'fake-order'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  rtoTags?: string[];
}

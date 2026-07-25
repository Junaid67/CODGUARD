import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RtoSignalEnum } from '../../../shared/enums';

/**
 * Step 2: the RTO signals + tags the merchant selects during onboarding.
 */
export class SaveRtoSignalsDto {
  @ApiProperty({
    enum: RtoSignalEnum,
    isArray: true,
    example: [RtoSignalEnum.CANCELLED, RtoSignalEnum.TAG, RtoSignalEnum.REFUNDED],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(RtoSignalEnum, { each: true })
  signals: RtoSignalEnum[];

  @ApiPropertyOptional({
    type: [String],
    example: ['rto', 'returned', 'wapas', 'fake-order'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['refused', 'customer denied', 'wapas'],
    description: 'Keywords matched against order notes (NOTE signal)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  noteKeywords?: string[];
}

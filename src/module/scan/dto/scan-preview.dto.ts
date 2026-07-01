import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Step 3 request: how far back to scan. Defaults to 180 days (6 months).
 */
export class ScanPreviewDto {
  @ApiPropertyOptional({ default: 180, minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  dateRangeDays = 180;
}

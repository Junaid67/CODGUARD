import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../shared/dtos';
import { OrderOutcomeEnum, RiskLevelEnum } from '../../../shared/enums';

export class OrdersFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RiskLevelEnum })
  @IsOptional()
  @IsEnum(RiskLevelEnum)
  riskLevel?: RiskLevelEnum;

  @ApiPropertyOptional({ enum: OrderOutcomeEnum })
  @IsOptional()
  @IsEnum(OrderOutcomeEnum)
  outcome?: OrderOutcomeEnum;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Search by customer name or order number' })
  @IsOptional()
  @IsString()
  search?: string;
}

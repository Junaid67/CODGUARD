import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanEnum } from '../../../shared/enums';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: PlanEnum, example: PlanEnum.STARTER })
  @IsEnum(PlanEnum)
  plan: PlanEnum;
}

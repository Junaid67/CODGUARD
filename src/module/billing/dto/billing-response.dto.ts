import { ApiProperty } from '@nestjs/swagger';
import { PlanEnum } from '../../../shared/enums';

export class BillingResponseDto {
  @ApiProperty({ enum: PlanEnum })
  plan: PlanEnum;

  @ApiProperty({ example: 'ACTIVE', description: 'ACTIVE | PENDING | CANCELLED' })
  status: string;

  @ApiProperty({ nullable: true })
  trialEndsAt: Date | null;

  @ApiProperty({ nullable: true })
  billingOn: Date | null;

  @ApiProperty({
    nullable: true,
    description: 'Present when a paid subscription was just created — redirect the merchant here to approve',
  })
  confirmationUrl?: string | null;
}

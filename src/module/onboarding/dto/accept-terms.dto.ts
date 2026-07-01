import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Step 4: terms acceptance. BOTH checkboxes must be true — enforced as a
 * business rule in the service so the merchant gets a clear message.
 */
export class AcceptTermsDto {
  @ApiProperty({ description: 'Merchant confirms acceptance of the terms' })
  @IsBoolean()
  confirmed: boolean;

  @ApiProperty({
    description: 'Merchant confirms their selected RTO signals are accurate',
  })
  @IsBoolean()
  signalsAccurate: boolean;
}

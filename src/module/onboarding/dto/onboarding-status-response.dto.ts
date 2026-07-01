import { ApiProperty } from '@nestjs/swagger';

export enum OnboardingStep {
  SIGNALS = 'SIGNALS', // step 2 — select signals/tags
  SCAN_PREVIEW = 'SCAN_PREVIEW', // step 3 — preview historical scan
  TERMS = 'TERMS', // step 4 — accept terms
  CONFIRM_SCAN = 'CONFIRM_SCAN', // step 5 — confirm scan
  COMPLETE = 'COMPLETE',
}

/**
 * Current onboarding progress for the embedded app to render the right step.
 */
export class OnboardingStatusResponseDto {
  @ApiProperty()
  onboardingComplete: boolean;

  @ApiProperty()
  hasSignals: boolean;

  @ApiProperty()
  signalsCount: number;

  @ApiProperty()
  tagsCount: number;

  @ApiProperty()
  termsAccepted: boolean;

  @ApiProperty({ nullable: true })
  termsAcceptedAt: Date | null;

  @ApiProperty({ nullable: true })
  lastScanAt: Date | null;

  @ApiProperty()
  totalOrdersScanned: number;

  @ApiProperty({ enum: OnboardingStep, description: 'The step the merchant should be on next' })
  nextStep: OnboardingStep;
}

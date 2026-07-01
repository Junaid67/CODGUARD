import { RiskLevelEnum } from '../enums';

/**
 * Misc app-wide helpers.
 */
export class AppUtil {
  /** Risk level from a delivery rate percentage (§9.2). */
  static riskLevelFromDeliveryRate(deliveryRate: number): RiskLevelEnum {
    if (deliveryRate >= 80) return RiskLevelEnum.LOW;
    if (deliveryRate >= 50) return RiskLevelEnum.MEDIUM;
    return RiskLevelEnum.HIGH;
  }

  /** The Shopify order tag for a given risk level: cod-risk:<level>. */
  static riskTag(riskLevel: RiskLevelEnum): string {
    return `cod-risk:${riskLevel}`;
  }

  /** True if two dates fall in different calendar months (or year). */
  static isDifferentMonth(a: Date, b: Date): boolean {
    return a.getMonth() !== b.getMonth() || a.getFullYear() !== b.getFullYear();
  }

  /** Rounds a number to 2 decimal places. */
  static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}

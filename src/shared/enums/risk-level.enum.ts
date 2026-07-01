export enum RiskLevelEnum {
  LOW = 'low', // delivery rate >= 80%
  MEDIUM = 'medium', // delivery rate >= 50% and < 80%
  HIGH = 'high', // delivery rate < 50%
  UNKNOWN = 'unknown', // no data → first-time customer
}

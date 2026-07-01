import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ApiErrorDto {
  @ApiProperty({ example: 'VALIDATION_FAILED' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'shopDomain should not be empty' })
  @Expose()
  message: string;
}

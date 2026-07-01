import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic success envelope returned by controllers via constructSuccessResponse.
 */
export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'SUCCESS' })
  message: string;

  @ApiProperty()
  data: T;

  constructor(data: T, message = 'SUCCESS') {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

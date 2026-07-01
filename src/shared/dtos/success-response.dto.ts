import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'SUCCESS' })
  message: string;

  constructor(message = 'SUCCESS') {
    this.success = true;
    this.message = message;
  }
}

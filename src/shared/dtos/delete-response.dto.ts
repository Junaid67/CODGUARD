import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'DELETED' })
  message: string;

  @ApiProperty({ example: 1, description: 'Number of records affected' })
  affected: number;

  constructor(affected = 1, message = 'DELETED') {
    this.success = true;
    this.message = message;
    this.affected = affected;
  }
}

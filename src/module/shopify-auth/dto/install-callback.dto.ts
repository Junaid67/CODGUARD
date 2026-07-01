import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Query params Shopify appends to the OAuth callback. Signature validation is
 * performed by the Shopify library during auth.callback; this DTO documents the
 * surface and types the values.
 */
export class InstallCallbackDto {
  @ApiProperty({ example: 'acme.myshopify.com' })
  @IsString()
  shop: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hmac?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timestamp?: string;
}

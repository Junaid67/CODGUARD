import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScanService } from './scan.service';
import { ScanPreviewDto } from './dto/scan-preview.dto';
import { ScanPreviewResponseDto } from './dto/scan-preview-response.dto';
import { ConfirmScanDto } from './dto/confirm-scan.dto';
import { ShopDomain, Audit } from '../../core/decorators';
import { ROUTES } from '../../app.routes';
import { constructSuccessResponse } from '../../shared/wrappers';

/**
 * Historical order scanning (§10 steps 3 & 5 + rescan). Authenticated routes.
 */
@ApiTags('scan')
@Controller(ROUTES.SCAN)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Step 3 — preview probable RTOs (not committed)' })
  @ApiOkResponse({ type: ScanPreviewResponseDto })
  async preview(
    @ShopDomain() shopDomain: string,
    @Body() dto: ScanPreviewDto,
  ) {
    const preview = await this.scanService.preview(shopDomain, dto.dateRangeDays);
    return constructSuccessResponse(preview);
  }

  @Post('confirm')
  @Audit('SCAN_CONFIRMED')
  @ApiOperation({ summary: 'Step 5 — commit the scan (build risk profiles)' })
  async confirm(
    @ShopDomain() shopDomain: string,
    @Body() dto: ConfirmScanDto,
  ) {
    const result = await this.scanService.confirm(shopDomain, dto);
    return constructSuccessResponse(result);
  }

  @Post('rescan')
  @Audit('RESCAN_RUN')
  @ApiOperation({ summary: 'Re-run a scan (GROWTH/PRO only)' })
  async rescan(
    @ShopDomain() shopDomain: string,
    @Body() dto: ScanPreviewDto,
  ) {
    const result = await this.scanService.rescan(shopDomain, dto.dateRangeDays);
    return constructSuccessResponse(result);
  }
}

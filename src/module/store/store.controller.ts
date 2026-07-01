import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { ShopDomain } from '../../core/decorators';
import { ROUTES } from '../../app.routes';
import { constructSuccessResponse } from '../../shared/wrappers';

/**
 * Store settings. All routes require an authenticated Shopify session
 * (global ShopifySessionGuard); the shop is resolved via @ShopDomain().
 */
@ApiTags('store')
@Controller(ROUTES.STORE)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get current store settings' })
  @ApiOkResponse({ type: StoreResponseDto })
  async getSettings(@ShopDomain() shopDomain: string) {
    const settings = await this.storeService.getSettings(shopDomain);
    return constructSuccessResponse(settings);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update RTO signals and tags' })
  @ApiOkResponse({ type: StoreResponseDto })
  async updateSettings(
    @ShopDomain() shopDomain: string,
    @Body() dto: UpdateStoreSettingsDto,
  ) {
    const updated = await this.storeService.updateSettings(shopDomain, dto);
    return constructSuccessResponse(updated, 'UPDATED');
  }
}

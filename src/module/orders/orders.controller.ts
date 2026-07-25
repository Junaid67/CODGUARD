import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStatsResponseDto } from './dto/order-stats-response.dto';
import { MarkRtoDto } from './dto/mark-rto.dto';
import { BulkMarkRtoDto } from './dto/bulk-mark-rto.dto';
import { AddManualRtoDto } from './dto/add-manual-rto.dto';
import { ShopDomain, Audit } from '../../core/decorators';
import { ROUTES } from '../../app.routes';
import { constructSuccessResponse } from '../../shared/wrappers';
import { OrderOutcomeEnum } from '../../shared/enums';

/**
 * Orders dashboard (§12 method 3). All routes authenticated + store-scoped.
 */
@ApiTags('orders')
@Controller(ROUTES.ORDERS)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders (paginated, filterable)' })
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  async list(
    @ShopDomain() shopDomain: string,
    @Query() filter: OrdersFilterDto,
  ) {
    const result = await this.ordersService.list(shopDomain, filter);
    return constructSuccessResponse(result);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard overview metrics' })
  @ApiOkResponse({ type: OrderStatsResponseDto })
  async stats(@ShopDomain() shopDomain: string) {
    const result = await this.ordersService.getStats(shopDomain);
    return constructSuccessResponse(result);
  }

  @Post(':id/rto')
  @Audit('RTO_MARKED')
  @ApiOperation({ summary: 'Mark an order as RTO' })
  @ApiOkResponse({ type: OrderResponseDto })
  async markRto(
    @ShopDomain() shopDomain: string,
    @Param('id') id: string,
    @Body() _dto: MarkRtoDto,
  ) {
    const order = await this.ordersService.markRto(shopDomain, id);
    return constructSuccessResponse(order, 'UPDATED');
  }

  @Post(':id/delivered')
  @Audit('DELIVERED_MARKED')
  @ApiOperation({ summary: 'Mark an order as delivered' })
  @ApiOkResponse({ type: OrderResponseDto })
  async markDelivered(
    @ShopDomain() shopDomain: string,
    @Param('id') id: string,
  ) {
    const order = await this.ordersService.markDelivered(shopDomain, id);
    return constructSuccessResponse(order, 'UPDATED');
  }

  @Post('bulk/rto')
  @Audit('BULK_RTO_MARKED')
  @ApiOperation({ summary: 'Bulk mark orders as RTO' })
  async bulkRto(
    @ShopDomain() shopDomain: string,
    @Body() dto: BulkMarkRtoDto,
  ) {
    const result = await this.ordersService.bulkMark(
      shopDomain,
      dto.orderIds,
      OrderOutcomeEnum.RTO,
    );
    return constructSuccessResponse(result, 'UPDATED');
  }

  @Post('bulk/delivered')
  @Audit('BULK_DELIVERED_MARKED')
  @ApiOperation({ summary: 'Bulk mark orders as delivered' })
  async bulkDelivered(
    @ShopDomain() shopDomain: string,
    @Body() dto: BulkMarkRtoDto,
  ) {
    const result = await this.ordersService.bulkMark(
      shopDomain,
      dto.orderIds,
      OrderOutcomeEnum.DELIVERED,
    );
    return constructSuccessResponse(result, 'UPDATED');
  }

  @Get('manual')
  @ApiOperation({ summary: 'Settings — list manually-added RTO entries' })
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  async listManual(@ShopDomain() shopDomain: string) {
    const result = await this.ordersService.listManualRto(shopDomain);
    return constructSuccessResponse(result);
  }

  @Post('manual')
  @Audit('MANUAL_RTO_ADDED')
  @ApiOperation({ summary: 'Settings — manually flag a phone number as RTO' })
  @ApiOkResponse({ type: OrderResponseDto })
  async addManual(
    @ShopDomain() shopDomain: string,
    @Body() dto: AddManualRtoDto,
  ) {
    const result = await this.ordersService.addManualRto(shopDomain, dto.phone);
    return constructSuccessResponse(result, 'CREATED');
  }

  @Delete('manual/:id')
  @Audit('MANUAL_RTO_REMOVED')
  @ApiOperation({ summary: 'Settings — remove a manually-added RTO entry' })
  async removeManual(@ShopDomain() shopDomain: string, @Param('id') id: string) {
    await this.ordersService.removeManualRto(shopDomain, id);
    return constructSuccessResponse(null, 'DELETED');
  }
}

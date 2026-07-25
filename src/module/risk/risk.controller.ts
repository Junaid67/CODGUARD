import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RiskService } from './risk.service';
import { ScorePhoneDto } from './dto/score-phone.dto';
import { RiskScoreResponseDto } from './dto/risk-score-response.dto';
import { ROUTES } from '../../app.routes';
import { constructSuccessResponse } from '../../shared/wrappers';

/**
 * Customer intelligence lookup (§11): lets an authenticated merchant check a
 * phone number's aggregated cross-store delivery reputation before shipping.
 * POST (not GET) so the raw phone never lands in URL/access logs.
 */
@ApiTags('risk')
@Controller(ROUTES.RISK)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('score')
  @ApiOperation({ summary: 'Score a phone number (customer intelligence)' })
  @ApiOkResponse({ type: RiskScoreResponseDto })
  async score(@Body() dto: ScorePhoneDto) {
    const result = await this.riskService.scorePhone(dto.phone);
    return constructSuccessResponse(result);
  }
}

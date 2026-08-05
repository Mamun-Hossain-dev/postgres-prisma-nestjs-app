import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ResponseMessage } from '../../common/utils/api-response.util';
import type { PublicUser } from '../users/interfaces/user.interface';
import { Role } from '../users/interfaces/user.interface';
import {
  CreateRefundDto,
  RefundQueryDto,
} from '../payments/refunds/dto/create-refund.dto';
import { RefundService } from './refund.service';

@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Refund requested')
  requestRefund(@CurrentUser() user: PublicUser, @Body() dto: CreateRefundDto) {
    return this.refundService.requestRefund(
      user.id,
      dto.paymentId,
      dto.amount,
      dto.reason,
      dto.idempotencyKey,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Refunds fetched successfully')
  findAll(@Query() query: RefundQueryDto) {
    return this.refundService.findAll(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Refund fetched successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.refundService.findOne(id);
  }
}

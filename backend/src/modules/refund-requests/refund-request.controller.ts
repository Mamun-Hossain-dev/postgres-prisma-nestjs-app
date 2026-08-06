import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { DecideRefundRequestDto } from './dto/decide-refund-request.dto';
import { RefundRequestQueryDto } from './dto/refund-request-query.dto';
import { RefundRequestService } from './refund-request.service';

@Controller('refund-requests')
export class RefundRequestController {
  constructor(private readonly refundRequestService: RefundRequestService) {}

  @Post()
  @ResponseMessage('Refund request submitted')
  request(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateRefundRequestDto,
  ) {
    return this.refundRequestService.request(user.id, dto.orderId, dto.reason);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Refund requests fetched successfully')
  findAllForAdmin(@Query() query: RefundRequestQueryDto) {
    return this.refundRequestService.findAllForAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Refund request fetched successfully')
  findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.refundRequestService.findOneForAdmin(id);
  }

  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Refund request approved')
  approve(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecideRefundRequestDto,
  ) {
    return this.refundRequestService.approve(user.id, id, dto.note, dto.amount);
  }

  @Patch('admin/:id/deny')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Refund request denied')
  deny(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecideRefundRequestDto,
  ) {
    return this.refundRequestService.deny(user.id, id, dto.note);
  }

  @Get()
  @ResponseMessage('Refund requests fetched successfully')
  findAll(
    @CurrentUser() user: PublicUser,
    @Query() query: RefundRequestQueryDto,
  ) {
    return this.refundRequestService.findAllForUser(user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Refund request fetched successfully')
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.refundRequestService.findOne(user.id, id);
  }
}

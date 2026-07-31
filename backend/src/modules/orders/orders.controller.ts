import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ResponseMessage } from '../../common/utils/api-response.util';
import type { PublicUser } from '../users/interfaces/user.interface';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ResponseMessage('Orders fetched successfully')
  findAll(@CurrentUser() user: PublicUser, @Query() query: PaginationQueryDto) {
    return this.ordersService.findAll(user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Order fetched successfully')
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findOne(user.id, id);
  }

  @Get(':id/invoice')
  async invoice(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const invoice = await this.ordersService.generateInvoice(user.id, id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devicedock-order-${id}.pdf"`,
      'Content-Length': String(invoice.length),
    });
    response.send(invoice);
  }
}

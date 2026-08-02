import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ResponseMessage } from '../../common/utils/api-response.util';
import type { PublicUser } from '../users/interfaces/user.interface';
import { OrdersService } from './orders.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/interfaces/user.interface';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Orders fetched successfully')
  findAllForAdmin(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAllForAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Order fetched successfully')
  findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOneForAdmin(id);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Order deleted successfully')
  async deleteForAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.ordersService.deleteForAdmin(id);
    return null;
  }

  @Get('admin/:id/invoice')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async invoiceForAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const invoice = await this.ordersService.generateInvoiceForAdmin(id);
    this.sendInvoice(response, invoice, id);
  }

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
    this.sendInvoice(response, invoice, id);
  }

  private sendInvoice(response: Response, invoice: Buffer, id: number) {
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devicedock-order-${id}.pdf"`,
      'Content-Length': String(invoice.length),
    });
    response.send(invoice);
  }
}

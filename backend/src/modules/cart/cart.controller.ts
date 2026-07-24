import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/utils/api-response.util';
import type { PublicUser } from '../users/interfaces/user.interface';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ResponseMessage('Cart fetched successfully')
  getCart(@CurrentUser() user: PublicUser) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ResponseMessage('Product added to cart')
  addItem(@CurrentUser() user: PublicUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id, dto.productId, dto.quantity);
  }

  @Patch('items/:productId')
  @ResponseMessage('Cart item updated')
  updateItem(
    @CurrentUser() user: PublicUser,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, productId, dto.quantity);
  }

  @Delete('items/:productId')
  @ResponseMessage('Product removed from cart')
  removeItem(
    @CurrentUser() user: PublicUser,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete()
  @ResponseMessage('Cart cleared')
  clear(@CurrentUser() user: PublicUser) {
    return this.cartService.clear(user.id);
  }
}

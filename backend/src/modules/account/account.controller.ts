import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/utils/api-response.util';
import type { PublicUser } from '../users/interfaces/user.interface';
import { AccountService } from './account.service';
import {
  AddWishlistDto,
  SaveAddressDto,
  UpdateNotificationPreferencesDto,
} from './dto/account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get('addresses')
  @ResponseMessage('Addresses fetched successfully')
  addresses(@CurrentUser() user: PublicUser) {
    return this.service.listAddresses(user.id);
  }

  @Post('addresses')
  @ResponseMessage('Address saved successfully')
  createAddress(@CurrentUser() user: PublicUser, @Body() dto: SaveAddressDto) {
    return this.service.createAddress(user.id, dto);
  }

  @Put('addresses/:id')
  @ResponseMessage('Address updated successfully')
  updateAddress(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveAddressDto,
  ) {
    return this.service.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  @ResponseMessage('Address deleted successfully')
  async deleteAddress(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.service.deleteAddress(user.id, id);
    return null;
  }

  @Get('wishlist')
  @ResponseMessage('Wishlist fetched successfully')
  wishlist(@CurrentUser() user: PublicUser) {
    return this.service.listWishlist(user.id);
  }

  @Post('wishlist')
  @ResponseMessage('Product saved to wishlist')
  addWishlist(@CurrentUser() user: PublicUser, @Body() dto: AddWishlistDto) {
    return this.service.addWishlist(user.id, dto.productId);
  }

  @Delete('wishlist/:productId')
  @ResponseMessage('Product removed from wishlist')
  async removeWishlist(
    @CurrentUser() user: PublicUser,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    await this.service.removeWishlist(user.id, productId);
    return null;
  }

  @Get('notifications')
  @ResponseMessage('Notifications fetched successfully')
  notifications(@CurrentUser() user: PublicUser) {
    return this.service.listNotifications(user.id);
  }

  @Patch('notifications/:id/read')
  @ResponseMessage('Notification marked as read')
  async markRead(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.service.markNotificationRead(user.id, id);
    return null;
  }

  @Get('notification-preferences')
  @ResponseMessage('Notification preferences fetched successfully')
  notificationPreferences(@CurrentUser() user: PublicUser) {
    return this.service.getNotificationPreferences(user.id);
  }

  @Patch('notification-preferences')
  @ResponseMessage('Notification preferences updated successfully')
  updateNotificationPreferences(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.service.updateNotificationPreferences(user.id, dto);
  }
}

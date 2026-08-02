import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage } from '../../common/utils/api-response.util';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from './interfaces/user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { PublicUser } from './interfaces/user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageFileValidationPipe } from '../../infrastructure/uploads/pipes/image-file-validation.pipe';
import { toFileToStore } from '../../infrastructure/uploads/utils/multer-file.util';
import { UserQueryDto } from './dto/user-query.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Users fetched successfully')
  findAll(@Query() query: UserQueryDto) {
    return this.userService.getAllUsers(query);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('User fetched successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage('User created successfully')
  create(
    @Body() dto: CreateUserDto,
    @UploadedFile(ImageFileValidationPipe) image?: Express.Multer.File,
  ) {
    return this.userService.createUser(
      dto,
      image ? toFileToStore(image) : undefined,
    );
  }

  @Delete('me/profile-image')
  @ResponseMessage('Profile image removed successfully')
  removeProfileImage(@CurrentUser() user: PublicUser) {
    return this.userService.removeProfileImage(user.id);
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage('Profile updated successfully')
  updateMe(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateUserDto,
    @UploadedFile(ImageFileValidationPipe) image?: Express.Multer.File,
  ) {
    return this.userService.updateUser(
      user.id,
      dto,
      image ? toFileToStore(image) : undefined,
    );
  }

  @Delete('me')
  @ResponseMessage('Account deleted successfully')
  async deleteMe(@CurrentUser() user: PublicUser) {
    await this.userService.deleteUser(user.id);

    return null;
  }

  @Patch('me/password')
  @ResponseMessage('Password updated successfully')
  async changePassword(
    @CurrentUser() user: PublicUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return null;
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage('User updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UploadedFile(ImageFileValidationPipe) image?: Express.Multer.File,
  ) {
    return this.userService.updateUser(
      id,
      dto,
      image ? toFileToStore(image) : undefined,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/block')
  @ResponseMessage('User blocked successfully')
  block(@Param('id', ParseIntPipe) id: number) {
    return this.userService.setUserBlocked(id, true);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/unblock')
  @ResponseMessage('User unblocked successfully')
  unblock(@Param('id', ParseIntPipe) id: number) {
    return this.userService.setUserBlocked(id, false);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ResponseMessage('User deleted successfully')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.deleteUser(id);

    return null;
  }
}

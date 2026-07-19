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
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage } from '../common/utils/api-response.util';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './interfaces/user.interface';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { PublicUser } from './interfaces/user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageFileValidationPipe } from '../uploads/pipes/image-file-validation.pipe';
import { toFileToStore } from '../uploads/utils/multer-file.util';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get()
  @ResponseMessage('Users fetched successfully')
  findAll() {
    return this.userService.getAllUsers();
  }

  @Public()
  @Get(':id')
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

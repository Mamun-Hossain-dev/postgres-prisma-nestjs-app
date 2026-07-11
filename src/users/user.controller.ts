import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage } from '../common/utils/api-response.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './interfaces/user.interface';
import { Public } from '../auth/decorators/public.decorator';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ResponseMessage('User created successfully')
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ResponseMessage('User updated successfully')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ResponseMessage('User deleted successfully')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.deleteUser(id);

    return null;
  }
}

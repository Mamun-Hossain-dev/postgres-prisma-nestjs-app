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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createApiResponse } from '../common/utils/api-response.util';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return createApiResponse(
      'Users fetched successfully',
      this.userService.getAllUsers(),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return createApiResponse(
      'User fetched successfully',
      this.userService.getUserById(id),
    );
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return createApiResponse(
      'User created successfully',
      this.userService.createUser(dto),
    );
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return createApiResponse(
      'User updated successfully',
      this.userService.updateUser(id, dto),
    );
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.deleteUser(id);

    return createApiResponse('User deleted successfully', null);
  }
}

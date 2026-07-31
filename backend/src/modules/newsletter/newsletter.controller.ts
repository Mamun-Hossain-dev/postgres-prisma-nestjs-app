import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ResponseMessage } from '../../common/utils/api-response.util';
import { Role } from '../users/interfaces/user.interface';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Post('subscribers')
  @ResponseMessage('Newsletter subscription confirmed')
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto.email, dto.name);
  }

  @Public()
  @Delete('subscribers')
  @ResponseMessage('Newsletter subscription cancelled')
  unsubscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.unsubscribe(dto.email);
  }

  @Get('subscribers')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Newsletter subscribers fetched successfully')
  findSubscribers(@Query() query: PaginationQueryDto) {
    return this.newsletterService.findSubscribers(query);
  }

  @Get('broadcasts')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Newsletter broadcasts fetched successfully')
  findBroadcasts(@Query() query: PaginationQueryDto) {
    return this.newsletterService.findBroadcasts(query);
  }

  @Post('broadcasts')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('Newsletter broadcast completed')
  broadcast(@Body() dto: CreateBroadcastDto) {
    return this.newsletterService.broadcast(dto);
  }
}

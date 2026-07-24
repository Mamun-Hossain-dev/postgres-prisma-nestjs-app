import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseMessage } from './common/utils/api-response.util';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @SkipThrottle() // Skip throttling for this route
  @ResponseMessage('App fetched successfully')
  getHello() {
    return this.appService.getHello();
  }
}

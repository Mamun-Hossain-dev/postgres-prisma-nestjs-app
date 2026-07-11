import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseMessage } from './common/utils/api-response.util';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ResponseMessage('App fetched successfully')
  getHello() {
    return this.appService.getHello();
  }
}

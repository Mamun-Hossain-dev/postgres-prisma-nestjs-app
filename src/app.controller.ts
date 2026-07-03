import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { createApiResponse } from './common/utils/api-response.util';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return createApiResponse(
      'App fetched successfully',
      this.appService.getHello(),
    );
  }
}

import { Controller, Delete, Get, Ip, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('check')
  @Post('check')
  @Put('check')
  @Delete('check')
  async handleCheck(@Req() req: Request, @Ip() ip?: string) {
    const method = req.method.toUpperCase();
    const clientIp = ip ?? req.ip ?? 'unknown';

    return this.appService.recordCheck(method, clientIp);
  }
}

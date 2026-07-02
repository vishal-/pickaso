import { Controller, Delete, Get, Ip, Post, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Res() res: Response): void {
    res.sendFile('index.html', { root: '.' });
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

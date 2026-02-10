import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() { }

  @Get()
  getStatus(): any {
    return {
      status: 'active',
      message: 'FreeLync API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  getHealth(): any {
    return { status: 'ok' };
  }
}

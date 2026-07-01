import { Injectable } from '@nestjs/common';
import { checks, getDb, initializeDatabase } from './database';
import { logger } from './logger';

@Injectable()
export class AppService {
  constructor() {
    initializeDatabase();
  }

  getHello(): string {
    return 'Hello World!';
  }

  async recordCheck(method: string, clientIp: string) {
    const timestamp = new Date().toISOString();
    const db = getDb();

    const result = await db.insert(checks).values({ method, clientIp, timestamp }).returning({ id: checks.id });

    const row = result[0];

    logger.info({ method, clientIp, timestamp, id: row.id }, 'check recorded');

    return {
      id: row.id,
      method,
      clientIp,
      timestamp,
    };
  }
}

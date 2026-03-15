import { Controller, Get } from '@nestjs/common';
import { OracleFactory } from './oracle.factory';

@Controller('db')
export class DbStatusController {
  constructor(private readonly factory: OracleFactory) {}

  @Get('status')
  async status() {
    const results: Record<string, { ok: boolean; error?: string }> = {};

    // test default
    try {
      const conn = await this.factory.getConnection('default');
      try {
        await conn.execute('SELECT 1 FROM DUAL');
        results.default = { ok: true };
      } finally {
        await conn.close();
      }
    } catch (err: any) {
      results.default = { ok: false, error: err?.message || String(err) };
    }

    // test support
    try {
      const conn = await this.factory.getConnection('support');
      try {
        await conn.execute('SELECT 1 FROM DUAL');
        results.support = { ok: true };
      } finally {
        await conn.close();
      }
    } catch (err: any) {
      results.support = { ok: false, error: err?.message || String(err) };
    }

    return results;
  }
}

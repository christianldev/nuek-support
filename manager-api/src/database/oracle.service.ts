import { Injectable } from '@nestjs/common';
import type { Connection } from 'oracledb';
import { OracleFactory } from './oracle.factory';

@Injectable()
export class OracleService {
  constructor(private readonly factory: OracleFactory) {}

  async getConnection(): Promise<Connection> {
    return this.factory.getConnection('default');
  }
}

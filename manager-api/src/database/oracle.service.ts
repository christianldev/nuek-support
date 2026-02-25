import { Injectable, InternalServerErrorException } from '@nestjs/common';
import oracledb, { type Connection } from 'oracledb';

@Injectable()
export class OracleService {
  async getConnection(): Promise<Connection> {
    const user = process.env.ORACLE_DB_USER;
    const password = process.env.ORACLE_DB_PASSWORD;
    const connectString = process.env.ORACLE_DB_CONNECT_STRING;

    if (!user || !password || !connectString) {
      throw new InternalServerErrorException(
        'Oracle DB is not configured. Set ORACLE_DB_USER, ORACLE_DB_PASSWORD and ORACLE_DB_CONNECT_STRING in manager-api/.env.',
      );
    }

    const normalizedConnectString = connectString.replace(/localhost/gi, '127.0.0.1');

    return oracledb.getConnection({
      user,
      password,
      connectString: normalizedConnectString,
    });
  }
}

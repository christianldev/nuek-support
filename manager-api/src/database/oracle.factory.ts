import { Injectable, InternalServerErrorException } from '@nestjs/common';
import oracledb, { type Connection } from 'oracledb';

export type OracleDbKey = 'default' | 'support';

@Injectable()
export class OracleFactory {
  private normalize(connectString?: string) {
    if (!connectString) return connectString;
    return connectString.replace(/localhost/gi, '127.0.0.1');
  }

  async getConnection(which: OracleDbKey = 'default'): Promise<Connection> {
    const userEnv = which === 'support' ? 'ORACLE_DB_SUPPORT_USER' : 'ORACLE_DB_USER';
    const passEnv = which === 'support' ? 'ORACLE_DB_SUPPORT_PASSWORD' : 'ORACLE_DB_PASSWORD';
    const connEnv = which === 'support' ? 'ORACLE_DB_SUPPORT_CONNECT_STRING' : 'ORACLE_DB_CONNECT_STRING';

    const user = process.env[userEnv];
    const password = process.env[passEnv]; 
    const connectString = process.env[connEnv];

    if (!user || !password || !connectString) {
      throw new InternalServerErrorException(
        `Oracle ${which} DB is not configured. Set ${userEnv}, ${passEnv} and ${connEnv} in manager-api/.env.`,
      );
    }

    const normalizedConnectString = this.normalize(connectString);

    try {
      return await oracledb.getConnection({ user, password, connectString: normalizedConnectString });
    } catch (err: any) {
      console.error(`OracleFactory: failed to get connection for ${which}`, err && err.message ? err.message : err);
      throw new InternalServerErrorException(`Failed to connect to Oracle ${which} DB: ${err && err.message ? err.message : 'unknown error'}`);
    }
  }
}

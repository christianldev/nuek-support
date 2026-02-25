import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash } from 'crypto';
import oracledb from 'oracledb';
import { OracleService } from '../../database/oracle.service';

interface OracleUserRow {
  [key: string]: unknown;
}

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);

  constructor(
    private readonly oracleService: OracleService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      throw new UnauthorizedException('Username and password are required');
    }

    const userRow = await this.findUserByUsername(normalizedUsername);

    if (!userRow) {
      if (this.isDebugEnabled()) {
        this.logger.warn(
          `No Oracle user found for username: ${normalizedUsername}`,
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordValue, userPayload } = this.extractUserAndPassword(userRow);
    await this.validatePassword(password, passwordValue);

    const accessToken = await this.jwtService.signAsync(userPayload, {
      secret: this.getAccessSecret(),
      expiresIn: this.getAccessExpiresInSeconds(),
    });

    const refreshToken = await this.jwtService.signAsync(userPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getRefreshExpiresInSeconds(),
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: userPayload,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpiresInSeconds(),
      });

      return {
        accessToken,
        tokenType: 'Bearer',
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyAccessToken(accessToken: string) {
    try {
      return await this.jwtService.verifyAsync<Record<string, unknown>>(
        accessToken,
        {
          secret: this.getAccessSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async findUserByUsername(
    username: string,
  ): Promise<OracleUserRow | null> {
    const connection = await this.oracleService.getConnection();

    try {
      const tableName = this.getSafeSqlIdentifier(
        process.env.ORACLE_AUTH_TABLE ?? 'SGDT947',
      );

      const usernameColumn = this.getSafeSqlIdentifier(
        process.env.ORACLE_AUTH_USERNAME_COLUMN ?? 'USUARIO',
      );

      const query = `SELECT * FROM ${tableName} WHERE UPPER(TRIM(${usernameColumn})) = UPPER(:username) AND ROWNUM = 1`;

      const result = await connection.execute<OracleUserRow>(
        query,
        { username: username.trim() },
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        },
      );

      return (result.rows?.[0] as OracleUserRow | undefined) ?? null;
    } finally {
      await connection.close();
    }
  }

  private extractUserAndPassword(row: OracleUserRow): {
    passwordValue: string;
    userPayload: Record<string, unknown>;
  } {
    const passwordColumnName = (
      process.env.ORACLE_AUTH_PASSWORD_COLUMN ?? 'PASSWORDD'
    ).toUpperCase();

    const usernameColumnName = (
      process.env.ORACLE_AUTH_USERNAME_COLUMN ?? 'USUARIO'
    ).toUpperCase();

    const passwordValue = row[passwordColumnName];

    if (typeof passwordValue !== 'string') {
      throw new InternalServerErrorException(
        `Password column ${passwordColumnName} was not found or is invalid in Oracle table.`,
      );
    }

    const usernameValue = row[usernameColumnName];
    const idValue =
      row.ID ??
      row.USER_ID ??
      row.USUARIO_ID ??
      row.CODIGO ??
      row[usernameColumnName] ??
      'local-user';

    return {
      passwordValue,
      userPayload: {
        sub: String(idValue),
        username:
          typeof usernameValue === 'string' ? usernameValue.trim() : undefined,
        provider: 'local',
      },
    };
  }

  private async validatePassword(
    providedPassword: string,
    persistedPassword: string,
  ): Promise<void> {
    const algorithm = this.getPasswordAlgorithm();
    const storedValue = persistedPassword.trim();

    let isValid = false;

    if (algorithm === 'sha256') {
      const candidateHashes = this.buildSha256Candidates(providedPassword);
      const storedHash = storedValue.toLowerCase();
      isValid = Array.from(candidateHashes.values()).includes(storedHash);

      if (!isValid && this.isDebugEnabled()) {
        this.logger.warn(
          `SHA256 mismatch. Stored hash: ${storedHash}. Candidates: ${JSON.stringify(
            Object.fromEntries(candidateHashes),
          )}`,
        );
      }
    } else if (algorithm === 'bcrypt') {
      isValid = await compare(providedPassword, storedValue);
    } else {
      isValid = providedPassword === storedValue;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private getAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET ?? 'change-access-secret';
  }

  private getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? 'change-refresh-secret';
  }

  private getAccessExpiresInSeconds(): number {
    return this.getPositiveNumberFromEnv('JWT_ACCESS_EXPIRES_IN', 900);
  }

  private getRefreshExpiresInSeconds(): number {
    return this.getPositiveNumberFromEnv('JWT_REFRESH_EXPIRES_IN', 604800);
  }

  private getPositiveNumberFromEnv(name: string, fallback: number): number {
    const rawValue = process.env[name];

    if (!rawValue) {
      return fallback;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0
      ? parsedValue
      : fallback;
  }

  private getSafeSqlIdentifier(rawValue: string): string {
    const normalizedValue = rawValue.trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalizedValue)) {
      throw new InternalServerErrorException(
        `Invalid SQL identifier: ${rawValue}`,
      );
    }

    return normalizedValue.toUpperCase();
  }

  private getPasswordAlgorithm(): 'plain' | 'bcrypt' | 'sha256' {
    const configuredValue =
      process.env.ORACLE_AUTH_PASSWORD_ALGORITHM?.trim().toLowerCase();

    if (
      configuredValue === 'plain' ||
      configuredValue === 'bcrypt' ||
      configuredValue === 'sha256'
    ) {
      return configuredValue;
    }

    if (process.env.ORACLE_AUTH_PASSWORD_HASHED === 'true') {
      return 'bcrypt';
    }

    return 'plain';
  }

  private applySha256Transform(password: string): string {
    const transform =
      process.env.ORACLE_AUTH_SHA256_TRANSFORM?.trim().toLowerCase() ??
      'trim-upper';

    if (transform === 'none') {
      return password;
    }

    if (transform === 'trim') {
      return password.trim();
    }

    if (transform === 'upper') {
      return password.toUpperCase();
    }

    if (transform === 'lower') {
      return password.toLowerCase();
    }

    if (transform === 'trim-lower') {
      return password.trim().toLowerCase();
    }

    return password.trim().toUpperCase();
  }

  private buildSha256Candidates(password: string): Map<string, string> {
    const configuredTransform = this.applySha256Transform(password);
    const variants = new Map<string, string>([
      ['configured', configuredTransform],
    ]);

    const useFallbacks =
      (process.env.ORACLE_AUTH_SHA256_ENABLE_FALLBACKS ?? 'true') !== 'false';

    if (useFallbacks) {
      variants.set('none', password);
      variants.set('trim', password.trim());
      variants.set('upper', password.toUpperCase());
      variants.set('lower', password.toLowerCase());
      variants.set('trim-upper', password.trim().toUpperCase());
      variants.set('trim-lower', password.trim().toLowerCase());
    }

    const hashes = new Map<string, string>();

    for (const [name, variant] of variants.entries()) {
      const hash = createHash('sha256').update(variant, 'utf8').digest('hex');
      hashes.set(name, hash.toLowerCase());
    }

    return hashes;
  }

  private isDebugEnabled(): boolean {
    return (process.env.ORACLE_AUTH_DEBUG ?? 'false') === 'true';
  }
}

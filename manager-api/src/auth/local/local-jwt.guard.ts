import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { LocalAuthService } from './local-auth.service';

@Injectable()
export class LocalJwtGuard implements CanActivate {
  constructor(private readonly localAuthService: LocalAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const accessToken = authorization.replace('Bearer ', '').trim();
    request.user = await this.localAuthService.verifyAccessToken(accessToken);

    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { isAuthenticated?: () => boolean }>();

    if (request.isAuthenticated?.()) {
      return true;
    }

    throw new UnauthorizedException('User is not authenticated');
  }
}

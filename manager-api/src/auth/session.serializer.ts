import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthUser } from './auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    user: AuthUser,
    done: (err: Error | null, payload: AuthUser) => void,
  ): void {
    done(null, user);
  }

  deserializeUser(
    payload: AuthUser,
    done: (err: Error | null, payload: AuthUser | null) => void,
  ): void {
    done(null, payload);
  }
}

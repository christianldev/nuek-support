import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OracleService } from '../database/oracle.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { LocalAuthService } from './local/local-auth.service';
import { LocalJwtGuard } from './local/local-jwt.guard';
import { AzureAdStrategy } from './strategies/azure-ad.strategy';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [PassportModule.register({ session: true }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    OracleService,
    LocalAuthService,
    LocalJwtGuard,
    AuthenticatedGuard,
    AzureAdStrategy,
    SessionSerializer,
  ],
  exports: [AuthenticatedGuard, LocalJwtGuard, LocalAuthService],
})
export class AuthModule {}

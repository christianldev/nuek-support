import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { AzureAdStrategy } from './strategies/azure-ad.strategy';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthenticatedGuard,
    AzureAdStrategy,
    SessionSerializer,
  ],
  exports: [AuthenticatedGuard],
})
export class AuthModule {}

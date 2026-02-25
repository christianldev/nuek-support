import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthenticatedGuard } from './guards/authenticated.guard';

@Controller('auth')
export class AuthController {
  private isMicrosoftAuthConfigured(): boolean {
    return Boolean(
      process.env.AZURE_AD_TENANT_ID &&
        process.env.AZURE_AD_CLIENT_ID &&
        process.env.AZURE_AD_CLIENT_SECRET &&
        process.env.AZURE_AD_CALLBACK_URL,
    );
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('azuread-openidconnect'))
  microsoftLogin(): void {
    if (!this.isMicrosoftAuthConfigured()) {
      throw new ServiceUnavailableException(
        'Microsoft auth is not configured. Set Azure AD env vars in manager-api/.env.',
      );
    }

    return;
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('azuread-openidconnect'))
  microsoftCallback(@Res() response: Response): void {
    if (!this.isMicrosoftAuthConfigured()) {
      throw new ServiceUnavailableException(
        'Microsoft auth is not configured. Set Azure AD env vars in manager-api/.env.',
      );
    }

    const successRedirect =
      process.env.AUTH_SUCCESS_REDIRECT ?? '/auth/profile';
    response.redirect(successRedirect);
  }

  @Get('profile')
  @UseGuards(AuthenticatedGuard)
  profile(@Req() request: Request) {
    return (request as Request & { user?: unknown }).user ?? null;
  }

  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  logout(@Req() request: Request, @Res() response: Response): void {
    (
      request as Request & { logout: (cb: (error?: Error) => void) => void }
    ).logout((error?: Error) => {
      if (error) {
        throw new UnauthorizedException('Logout failed');
      }

      request.session.destroy(() => {
        response.clearCookie('connect.sid');
        response.status(200).json({ message: 'Logout successful' });
      });
    });
  }
}

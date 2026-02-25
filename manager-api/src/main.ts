import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import passport from 'passport';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const clientOrigins = process.env.CLIENT_ORIGIN?.split(',').map((value) =>
    value.trim(),
  );
  app.enableCors({
    origin: clientOrigins && clientOrigins.length > 0 ? clientOrigins : true,
    credentials: true,
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'change-this-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

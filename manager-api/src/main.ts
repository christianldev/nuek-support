import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import passport from 'passport';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  let clientOrigins = process.env.CLIENT_ORIGIN?.split(',').map((value) =>
    value.trim(),
  );

  // In development, allow the Vite dev server origin (localhost:3001) in addition
  // to any configured client origins to avoid CORS issues when using a different
  // frontend dev port.
  if (process.env.NODE_ENV !== 'production') {
    const devOrigin = 'http://localhost:3001';
    clientOrigins = Array.from(new Set([...(clientOrigins ?? []), devOrigin]));
  }

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

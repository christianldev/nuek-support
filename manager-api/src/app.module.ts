import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ParkingModule } from './parking/parking.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, AuthModule, ParkingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

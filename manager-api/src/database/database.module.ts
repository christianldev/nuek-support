import { Global, Module } from '@nestjs/common';
import { OracleFactory } from './oracle.factory';
import { OracleService } from './oracle.service';
import { DbStatusController } from './db-status.controller';

@Global()
@Module({
  controllers: [DbStatusController],
  providers: [OracleFactory, OracleService],
  exports: [OracleFactory, OracleService],
})
export class DatabaseModule {}

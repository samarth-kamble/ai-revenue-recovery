import { Module } from '@nestjs/common';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';
import { RecoveryWorkerService } from './recovery-worker.service';

@Module({
  controllers: [RecoveryController],
  providers: [RecoveryService, RecoveryWorkerService],
  exports: [RecoveryService, RecoveryWorkerService],
})
export class RecoveryModule {}

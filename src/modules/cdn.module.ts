import { Module } from '@nestjs/common';
import { CdnController } from '../controllers/cdn.controller';
import { BunnyCdnService } from '../services/bunnycdn.service';

@Module({
  controllers: [CdnController],
  providers: [BunnyCdnService],
  exports: [BunnyCdnService]
})
export class CdnModule {}

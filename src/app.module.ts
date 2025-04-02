import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LayoutController } from './controllers/layout.controller';
import { RefinementController } from './controllers/refinement.controller';
import { LayoutService } from './services/layout.service';
import { RefinementService } from './services/refinement.service';
import { PrismaService } from './database/prisma.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,  // Maior timeout para chamadas de IA (60s)
      maxRedirects: 5,
    }),
    ConfigModule
  ],
  controllers: [
    LayoutController,
    RefinementController
  ],
  providers: [
    LayoutService,
    RefinementService,
    PrismaService
  ],
})
export class AppModule {}
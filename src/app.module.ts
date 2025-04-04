import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LayoutController } from './controllers/layout.controller';
import { RefinementController } from './controllers/refinement.controller';
import { CdnController } from './controllers/cdn.controller';
import { LayoutService } from './services/layout.service';
import { RefinementService } from './services/refinement.service';
import { PerplexityService } from './services/perplexity.service';
import { PrismaService } from './database/prisma.service';
import { BunnyCdnService } from './services/bunnycdn.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120000,  // Timeout aumentado para suportar chamadas mais longas
      maxRedirects: 5,
    }),
    ConfigModule.forRoot()
  ],
  controllers: [
    LayoutController,
    RefinementController,
    CdnController
  ],
  providers: [
    LayoutService,
    RefinementService,
    PrismaService,
    BunnyCdnService,
    PerplexityService // Suporte ao modelo gemini já incluído no PerplexityService
  ],
})
export class AppModule {}
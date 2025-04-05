import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RefinementController } from './controllers/refinement.controller';
import { CdnController } from './controllers/cdn.controller';
import { LayoutController } from './controllers/layout.controller';
import { RefinementService } from './services/refinement.service';
import { PerplexityService } from './services/perplexity.service';
import { PrismaService } from './database/prisma.service';
import { BunnyCdnService } from './services/bunnycdn.service';
import { ArtboardService } from './services/artboard.service';
import { LayoutService } from './services/layout.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120000,  // Timeout aumentado para suportar chamadas mais longas
      maxRedirects: 5,
    }),
    ConfigModule.forRoot(),
    AuthModule
  ],
  controllers: [
    RefinementController,
    CdnController,
    LayoutController
  ],
  providers: [
    RefinementService,
    PrismaService,
    BunnyCdnService,
    PerplexityService, // Suporte ao modelo gemini já incluído no PerplexityService
    ArtboardService,
    LayoutService, // Adicionado LayoutService como provedor
  ],
})
export class AppModule {}
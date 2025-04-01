import { Module } from '@nestjs/common';
import { RefinementController } from './refinement/refinement.controller';
import { RefinementService } from './refinement/refinement.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './config/configuration.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [RefinementController],
  providers: [RefinementService, ConfigurationService],
})
export class AppModule { }
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor() {
    // Carregar variáveis de ambiente no startup
    this.logEnvironmentVariables();
  }

  get perplexityApiKey(): string | undefined {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      this.logger.warn('PERPLEXITY_API_KEY não configurada. A funcionalidade de IA será desabilitada.');
    }
    return apiKey;
  }

  get usePerplexityAi(): boolean {
    return process.env.USE_PERPLEXITY_AI === 'true';
  }

  private logEnvironmentVariables(): void {
    this.logger.log(`Configuração IA: USE_PERPLEXITY_AI=${this.usePerplexityAi}`);
    
    // Mascarar a API key para segurança
    if (this.perplexityApiKey) {
      const maskedKey = this.perplexityApiKey.substring(0, 4) + '...' + 
                        this.perplexityApiKey.substring(this.perplexityApiKey.length - 4);
      this.logger.log(`API key configurada: ${maskedKey}`);
    } else {
      this.logger.error('API key do Perplexity não configurada!');
    }
  }
}
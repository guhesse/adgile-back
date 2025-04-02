import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConfigurationService {
    private readonly logger = new Logger(ConfigurationService.name);
    private readonly _perplexityApiKey: string;
    private readonly _usePerplexityAi: boolean;

    constructor() {
        // Carregar de variáveis de ambiente
        this._perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
        // Verifica ambas as formas de ativar o recurso: 'true' ou '1'
        this._usePerplexityAi = process.env.USE_PERPLEXITY_AI === 'true' ||
            process.env.USE_PERPLEXITY_AI === '1';

        // Logar configurações de inicialização (sem revelar a chave completa)
        const hasApiKey = !!this._perplexityApiKey;
        this.logger.log(`ConfigurationService inicializado`);
        this.logger.log(`Perplexity AI: ${this._usePerplexityAi ? 'Habilitado' : 'Desabilitado'}`);

        if (this._usePerplexityAi) {
            if (hasApiKey) {
                const maskedKey = this._perplexityApiKey.substring(0, 4) + '...' +
                    this._perplexityApiKey.substring(this._perplexityApiKey.length - 4);
                this.logger.log(`API Key configurada: ${maskedKey}`);
            } else {
                this.logger.warn(`Perplexity AI está habilitado mas nenhuma API Key foi configurada!`);
            }
        }
    }

    get perplexityApiKey(): string {
        return this._perplexityApiKey;
    }

    get usePerplexityAi(): boolean {
        return this._usePerplexityAi;
    }
}

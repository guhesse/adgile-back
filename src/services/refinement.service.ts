import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PerplexityService } from './perplexity.service';
import { LayoutAdapterUtils } from '../utils/layout-adapter.utils';
import { ArtboardService } from './artboard.service';
import { LayoutService } from './layout.service';
import {
    BannerSize,
    EditorElement,
    LayoutData,
    RefinedLayout
} from '../interfaces/layout.interface';

@Injectable()
export class RefinementService {
    private readonly logger = new Logger(RefinementService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly artboardService: ArtboardService,
        private readonly configService: ConfigService,
        private readonly perplexityService: PerplexityService,
        private readonly layoutService: LayoutService
    ) {
        this.logger.log('RefinementService inicializado');
    }

    async generateLayout(prompt: string, userId?: string): Promise<any> {
        // Primeiro verificamos se já existe um layout similar no banco de dados
        const existingLayouts = await this.artboardService.findAll();
        this.logger.log(`Buscando layouts similares ao prompt: '${prompt.substring(0, 50)}...'`);

        // Converter o layout gerado para o novo formato de dados
        const processLayoutForStorage = (layout: any) => ({
            width: layout.width || 1920,
            height: layout.height || 1080,
            elements: layout.elements || []
        });

        // Verificar se já existe um layout similar
        const similarLayout = this.findSimilarLayout(existingLayouts, prompt);
        if (similarLayout) {
            this.logger.log(`Layout similar encontrado: ${similarLayout.name} (ID: ${similarLayout.id})`);

            // Parse do conteúdo JSON
            try {
                return {
                    layout_type: similarLayout.LayoutType,
                    artboard: {
                        width: similarLayout.width,
                        height: similarLayout.height,
                        elements: similarLayout.Element || []
                    }
                };
            } catch (error: any) {
                this.logger.error(`Erro ao processar o layout encontrado: ${error?.message || 'Erro desconhecido'}`);
            }
        }

        // Se não encontrar, gera um novo layout usando a IA
        this.logger.log('Nenhum layout similar encontrado. Gerando novo layout com IA...');
        const generatedLayout = await this.callAIService(prompt);

        // Salva o novo layout no banco de dados
        try {
            // Create a new layout
            const newLayout = await this.layoutService.create({
                name: `Layout para: ${prompt.substring(0, 50)}...`,
                description: prompt,
                categoryId: "default", // Já estamos usando string diretamente
                tenantId: 1,
                createdBy: parseInt(userId || '1'),
            });

            // Create a new artboard for this layout
            const newArtboard = await this.artboardService.create(
                {
                    name: `Artboard para: ${prompt.substring(0, 50)}...`,
                    layout_id: newLayout.layout_id, // Use layout_id
                    width: generatedLayout.width || 1920,
                    height: generatedLayout.height || 1080,
                },
                1, // TODO: Get tenant_id from context
                parseInt(userId || '1') // TODO: Handle created_by properly
            );
            this.logger.log(`Novo layout gerado com ID: ${newLayout.layout_id} e artboard com ID: ${newArtboard.artboard_id}`);
        } catch (error: any) {
            this.logger.error(`Erro ao salvar layout gerado: ${error?.message || 'Erro desconhecido'}`);
        }

        return generatedLayout;
    }

    private findSimilarLayout(layouts: any[], prompt: string): any {
        // Implementação básica para encontrar layouts similares
        const normalizedPrompt = prompt.toLowerCase();
        const keywords = normalizedPrompt.split(/\s+/).filter(word => word.length > 3);

        if (keywords.length === 0) return null;

        let bestMatch = null;
        let highestScore = 0;

        for (const layout of layouts) {
            const layoutName = (layout.LayoutType?.name || '').toLowerCase();
            const layoutDesc = (layout.LayoutType?.description || '').toLowerCase();
            const artboardName = (layout.name || '').toLowerCase();
            const combinedText = `${layoutName} ${layoutDesc} ${artboardName}`;

            let score = 0;
            for (const keyword of keywords) {
                if (combinedText.includes(keyword)) {
                    score += 1;
                }
            }

            // Normalizar score pela quantidade de palavras-chave
            const normalizedScore = score / keywords.length;

            // Considerar um match se tiver pelo menos 50% das palavras-chave
            if (normalizedScore > 0.5 && normalizedScore > highestScore) {
                highestScore = normalizedScore;
                bestMatch = layout;
            }
        }

        return bestMatch;
    }

    private async callAIService(prompt: string): Promise<any> {
        // Implementação mock para gerar um layout básico
        this.logger.log('Gerando layout mock (substituir por chamada real à API de IA)');

        // Layout básico para teste
        return {
            format: {
                name: "Instagram Post",
                width: 1080,
                height: 1080
            },
            elements: [
                {
                    id: "text-heading",
                    type: "text",
                    content: "Título gerado por IA",
                    style: {
                        x: 100,
                        y: 100,
                        width: 880,
                        height: 150,
                        fontSize: 48,
                        color: "#333333",
                        fontWeight: "bold",
                        alignment: "center"
                    }
                },
                {
                    id: "text-description",
                    type: "text",
                    content: "Descrição gerada com base no prompt: " + prompt.substring(0, 100),
                    style: {
                        x: 100,
                        y: 300,
                        width: 880,
                        height: 200,
                        fontSize: 24,
                        color: "#666666",
                        alignment: "center"
                    }
                },
                {
                    id: "image-background",
                    type: "image",
                    content: "https://via.placeholder.com/1080x1080",
                    style: {
                        x: 0,
                        y: 0,
                        width: 1080,
                        height: 1080,
                        opacity: 0.3,
                        zIndex: -1
                    }
                }
            ]
        };
    }

    async refineLayout(layoutData: LayoutData): Promise<RefinedLayout[]> {
        try {
            // Verificação para garantir que layoutData não seja undefined
            if (!layoutData) {
                this.logger.error('layoutData está undefined');
                throw new Error('Dados do layout não fornecidos');
            }

            // Log dos dados recebidos para debug
            this.logger.log(`Iniciando refinamento de layout. Formato atual: ${JSON.stringify(layoutData.currentFormat)}`);
            this.logger.log(`Número de elementos: ${layoutData.elements?.length}`);
            this.logger.log(`Número de formatos alvo: ${layoutData.targetFormats?.length}`);

            const { currentFormat, elements, targetFormats } = layoutData;

            // Verificações adicionais
            if (!currentFormat) throw new Error('Formato atual não definido');
            if (!elements || !Array.isArray(elements)) throw new Error('Elementos do layout inválidos');
            if (!targetFormats || !Array.isArray(targetFormats)) throw new Error('Formatos de destino inválidos');

            // Salvar o layout original no banco de dados
            await this.saveOriginalLayout(currentFormat, elements);

            // Verificar se devemos usar a IA
            if (this.perplexityService.isAIEnabled()) {
                this.logger.log('🔄 Tentando usar a IA para refinamento');
                const batchSize = 2; // Processar lotes de 2 em 2
                const refinedLayouts: RefinedLayout[] = [];

                for (let i = 0; i < layoutData.targetFormats.length; i += batchSize) {
                    const batch = layoutData.targetFormats.slice(i, i + batchSize);
                    this.logger.log(`📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(layoutData.targetFormats.length / batchSize)} com ${batch.length} formatos.`);

                    try {
                        const batchLayouts = await this.perplexityService.refineLayoutWithPerplexity(
                            layoutData.currentFormat,
                            layoutData.elements,
                            batch
                        );

                        if (batchLayouts && Array.isArray(batchLayouts)) {
                            refinedLayouts.push(...batchLayouts);
                            this.logger.log(`✅ Lote processado com sucesso. Formatos: ${batch.map(f => f.name).join(', ')}`);
                        } else {
                            this.logger.warn(`⚠️ Nenhum layout válido retornado pela IA para o lote. Usando fallback baseado em regras.`);
                            refinedLayouts.push(...this.processWithRules(layoutData.currentFormat, layoutData.elements, batch));
                        }
                    } catch (error) {
                        this.logger.error(`❌ Erro ao processar lote com IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                        this.logger.log(`⚠️ Usando método baseado em regras para o lote atual.`);
                        refinedLayouts.push(...this.processWithRules(layoutData.currentFormat, layoutData.elements, batch));
                    }
                }

                if (refinedLayouts.length > 0) {
                    this.logger.log(`🎉 Refinamento concluído com IA. Total de ${refinedLayouts.length} layouts gerados.`);
                    await this.saveRefinedLayouts(layoutData.currentFormat, refinedLayouts);
                    return refinedLayouts;
                }

                this.logger.warn('⚠️ Nenhum layout válido retornado pela IA. Usando fallback baseado em regras.');
            } else {
                this.logger.log('IA desabilitada. Usando adaptação baseada em regras.');
            }

            // Fallback para método baseado em regras
            const refinedLayouts = this.processWithRules(layoutData.currentFormat, layoutData.elements, layoutData.targetFormats);
            await this.saveRefinedLayouts(layoutData.currentFormat, refinedLayouts);
            return refinedLayouts;
        } catch (error: unknown) {
            this.logger.error(`Erro ao refinar layout: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(`Falha ao refinar layout: ${errorMessage}`);
        }
    }

    private async saveOriginalLayout(currentFormat: BannerSize, elements: EditorElement[]): Promise<void> {
        try {
            const originalLayoutName = `Layout Original - ${currentFormat.name} (${currentFormat.width}x${currentFormat.height})`;
            const originalLayoutDesc = `Layout original antes do refinamento para outros formatos`;
            const originalLayoutContent = { format: currentFormat, elements };

            const savedOriginalLayout = await this.layoutService.create({
                name: originalLayoutName,
                description: originalLayoutDesc,
                content: JSON.stringify(originalLayoutContent),
                categoryId: null,
            });

            this.logger.log(`✅ Layout original salvo no banco de dados com ID: ${savedOriginalLayout.layout_id}`);
        } catch (error: any) {
            this.logger.warn(`⚠️ Erro ao salvar layout original: ${error?.message || 'Erro desconhecido'}`);
        }
    }

    private async saveRefinedLayouts(
        currentFormat: BannerSize,
        refinedLayouts: RefinedLayout[]
    ): Promise<void> {
        const savedLayoutIds: number[] = [];

        for (const layout of refinedLayouts) {
            try {
                const layoutName = `${currentFormat.name} → ${layout.format.name}`;
                const layoutDesc = `Layout convertido de ${currentFormat.width}x${currentFormat.height} para ${layout.format.width}x${layout.format.height}`;
                const layoutContent = { format: layout.format, elements: layout.elements };

                const savedLayout = await this.layoutService.create({
                    name: layoutName,
                    description: layoutDesc,
                    content: JSON.stringify(layoutContent),
                    categoryId: null,
                });

                savedLayoutIds.push(savedLayout.layout_id);
                this.logger.log(`✅ Layout para formato ${layout.format.name} salvo com ID: ${savedLayout.layout_id}`);
            } catch (error: any) {
                this.logger.warn(`⚠️ Erro ao salvar layout para formato ${layout.format.name}: ${error?.message || 'Erro desconhecido'}`);
            }
        }

        this.logger.log(`🎉 ${savedLayoutIds.length} de ${refinedLayouts.length} layouts refinados salvos no banco de dados`);
    }

    private processWithRules(
        currentFormat: BannerSize,
        elements: EditorElement[],
        targetFormats: BannerSize[]
    ): RefinedLayout[] {
        this.logger.log('Utilizando refinamento baseado em regras (sem IA) para todos os formatos');

        return targetFormats.map((targetFormat: BannerSize) => {
            const adaptedElements = elements.map((element: EditorElement) =>
                LayoutAdapterUtils.adaptElementToNewFormat(element, currentFormat, targetFormat)
            );
            return { format: targetFormat, elements: adaptedElements };
        });
    };


}
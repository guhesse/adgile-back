import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LayoutService } from './layout.service';
import { ConfigurationService } from '../config/configuration.service';

// Interfaces para tipagem
interface BannerSize {
    name: string;
    width: number;
    height: number;
    orientation?: 'vertical' | 'horizontal' | 'square';
}

interface ElementStyle {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    xPercent?: number;
    yPercent?: number;
    widthPercent?: number;
    heightPercent?: number;
    [key: string]: any; // Para outras propriedades de estilo
}

interface EditorElement {
    id: string;
    type: string;
    content: string;
    style: ElementStyle;
    sizeId?: string;
    originalId?: string;
    columns?: any;
    [key: string]: any; // Para outras propriedades do elemento
}

interface LayoutData {
    currentFormat: BannerSize;
    elements: EditorElement[];
    targetFormats: BannerSize[];
}

export interface RefinedLayout {
    format: BannerSize;
    elements: EditorElement[];
}

// Define a interface para a resposta da API Perplexity
interface PerplexityResponse {
    data: {
        choices: Array<{
            message: {
                content: string;
            };
        }>;
    };
}

@Injectable()
export class RefinementService {
    private readonly logger = new Logger(RefinementService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly layoutService: LayoutService,
        private readonly configService: ConfigurationService
    ) {
        // Log no construtor para confirmar a inicialização do serviço
        this.logger.log('RefinementService inicializado');
        
        // Verificar se as configurações do Perplexity estão disponíveis
        const hasApiKey = !!this.configService.perplexityApiKey;
        const isEnabled = this.configService.usePerplexityAi;
        
        this.logger.log(`Perplexity AI ${isEnabled ? 'habilitado' : 'desabilitado'} (API Key ${hasApiKey ? 'configurada' : 'não configurada'})`);
        
        // Se estiver habilitado mas sem API key, logar aviso
        if (isEnabled && !hasApiKey) {
            this.logger.warn('Perplexity AI está habilitado, mas a API Key não está configurada. Configure a API_KEY no arquivo .env');
        }
    }

    async generateLayout(prompt: string, userId?: string): Promise<any> {
        // Primeiro verificamos se já existe um layout similar no banco de dados
        const existingLayouts = await this.layoutService.findAll();
        
        this.logger.log(`Buscando layouts similares ao prompt: '${prompt.substring(0, 50)}...'`);
        
        // Aqui implementamos uma lógica simples para verificar se já existe um layout similar
        const similarLayout = this.findSimilarLayout(existingLayouts, prompt);
        if (similarLayout) {
            this.logger.log(`Layout similar encontrado: ${similarLayout.name} (ID: ${similarLayout.id})`);
            
            // Parse do conteúdo JSON
            try {
                const content = typeof similarLayout.content === 'string' 
                    ? JSON.parse(similarLayout.content) 
                    : similarLayout.content;
                return content;
            } catch (error: any) {
                this.logger.error(`Erro ao fazer parse do conteúdo do layout: ${error?.message || 'Erro desconhecido'}`);
            }
        }
        
        // Se não encontrar, gera um novo layout usando a IA
        this.logger.log('Nenhum layout similar encontrado. Gerando novo layout com IA...');
        const generatedLayout = await this.callAIService(prompt);
        
        // Salva o novo layout no banco de dados
        try {
            await this.layoutService.create({
                name: `Layout para: ${prompt.substring(0, 50)}...`,
                description: prompt,
                content: JSON.stringify(generatedLayout),
                userId: userId,
            });
            this.logger.log('Novo layout gerado e salvo no banco de dados');
        } catch (error: any) {
            this.logger.error(`Erro ao salvar layout gerado: ${error?.message || 'Erro desconhecido'}`);
        }
        
        return generatedLayout;
    }

    private findSimilarLayout(layouts: any[], prompt: string): any {
        // Implementação básica para encontrar layouts similares
        // Converte prompt para minúsculas para comparação
        const normalizedPrompt = prompt.toLowerCase();
        const keywords = normalizedPrompt.split(/\s+/).filter(word => word.length > 3);
        
        // Não prosseguir se não houver palavras-chave significativas
        if (keywords.length === 0) return null;
        
        // Pontuar cada layout com base na presença de palavras-chave no nome ou descrição
        let bestMatch = null;
        let highestScore = 0;
        
        for (const layout of layouts) {
            const layoutName = (layout.name || '').toLowerCase();
            const layoutDesc = (layout.description || '').toLowerCase();
            const combinedText = `${layoutName} ${layoutDesc}`;
            
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
            // Verificação adicional para garantir que layoutData não seja undefined
            if (!layoutData) {
                this.logger.error('layoutData está undefined');
                throw new Error('Dados do layout não fornecidos');
            }

            // Log dos dados recebidos para debug
            this.logger.log(`Iniciando refinamento de layout. Formato atual: ${JSON.stringify(layoutData.currentFormat)}`);
            this.logger.log(`Número de elementos: ${layoutData.elements?.length}`);
            this.logger.log(`Número de formatos alvo: ${layoutData.targetFormats?.length}`);

            const { currentFormat, elements, targetFormats } = layoutData;

            // Verificações adicionais após a desestruturação
            if (!currentFormat) {
                throw new Error('Formato atual não definido após desestruturação');
            }

            if (!elements || !Array.isArray(elements)) {
                throw new Error('Elementos do layout inválidos após desestruturação');
            }

            if (!targetFormats || !Array.isArray(targetFormats)) {
                throw new Error('Formatos de destino inválidos após desestruturação');
            }

            // Processar formatos em lotes para evitar truncamento da resposta
            const batchSize = 1; // Processar apenas 1 formato por vez para maior confiabilidade
            let allRefinedLayouts: RefinedLayout[] = [];
            
            // Verificar se devemos usar o Perplexity AI
            const apiKey = this.configService.perplexityApiKey;
            const useAI = this.configService.usePerplexityAi;
            
            if (useAI && apiKey) {
                this.logger.log('🧠 Tentando usar o Perplexity AI para refinamento avançado');
                
                // Criar um array para rastrear formatos processados com sucesso
                const processedFormats = new Set<string>();
                
                // Dividir os formatos em lotes
                for (let i = 0; i < targetFormats.length; i += batchSize) {
                    // Obter o lote atual de formatos
                    const formatsBatch = targetFormats.slice(i, i + batchSize);
                    const formatNames = formatsBatch.map(f => f.name).join(', ');
                    this.logger.log(`Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(targetFormats.length / batchSize)} com formatos: ${formatNames}`);
                    
                    try {
                        // Processar este lote de formatos
                        const batchLayouts = await this.refineLayoutWithPerplexity(
                            currentFormat, 
                            elements, // Enviar todos os elementos, sem limitação
                            formatsBatch
                        );
                        
                        // Adicionar os layouts refinados ao resultado final
                        if (batchLayouts && Array.isArray(batchLayouts)) {
                            // Verificar se recebemos todos os formatos solicitados
                            const receivedFormats = batchLayouts.map(l => l.format.name);
                            this.logger.log(`✅ Formatos recebidos no lote: ${receivedFormats.join(', ')}`);
                            
                            // Adicionar aos layouts refinados
                            allRefinedLayouts = [...allRefinedLayouts, ...batchLayouts];
                            
                            // Registrar formatos processados com sucesso
                            batchLayouts.forEach(layout => {
                                processedFormats.add(layout.format.name);
                            });
                            
                            this.logger.log(`✅ Lote processado com sucesso. ${batchLayouts.length} layouts adicionados: ${batchLayouts.map(l => l.format.name).join(', ')}`);
                        }
                    } catch (batchError: unknown) {
                        const errorMessage = batchError instanceof Error 
                            ? batchError.message 
                            : 'Erro desconhecido';
                        this.logger.error(`❌ Erro ao processar lote de formatos com Perplexity: ${errorMessage}`);
                        
                        // Para este lote específico, usamos o método baseado em regras
                        this.logger.log(`Usando método baseado em regras para o lote atual de ${formatsBatch.length} formatos: ${formatNames}`);
                        const fallbackLayouts = formatsBatch.map((targetFormat: BannerSize) => {
                            const adaptedElements = elements.map((element: EditorElement) => 
                                this.adaptElementToNewFormat(element, currentFormat, targetFormat)
                            );
                            return { format: targetFormat, elements: adaptedElements };
                        });
                        
                        allRefinedLayouts = [...allRefinedLayouts, ...fallbackLayouts];
                        
                        // Registrar formatos processados com fallback
                        formatsBatch.forEach(format => {
                            processedFormats.add(format.name);
                        });
                    }
                }
                
                // Verificar se todos os formatos solicitados foram processados
                const missingFormats = targetFormats.filter(format => !processedFormats.has(format.name));
                
                if (missingFormats.length > 0) {
                    this.logger.warn(`⚠️ Alguns formatos não foram processados: ${missingFormats.map(f => f.name).join(', ')}`);
                    
                    // Processar os formatos faltantes com o método baseado em regras
                    this.logger.log(`Aplicando método baseado em regras para ${missingFormats.length} formatos faltantes`);
                    const missingLayouts = missingFormats.map((targetFormat: BannerSize) => {
                        const adaptedElements = elements.map((element: EditorElement) => 
                            this.adaptElementToNewFormat(element, currentFormat, targetFormat)
                        );
                        return { format: targetFormat, elements: adaptedElements };
                    });
                    
                    allRefinedLayouts = [...allRefinedLayouts, ...missingLayouts];
                }
                
                if (allRefinedLayouts.length > 0) {
                    this.logger.log(`🎉 Refinamento concluído. Total de ${allRefinedLayouts.length} layouts gerados de ${targetFormats.length} solicitados.`);
                    return allRefinedLayouts;
                }
            } else {
                if (useAI) {
                    this.logger.warn('Perplexity AI está habilitado, mas a API Key não está configurada. Usando método baseado em regras.');
                } else {
                    this.logger.log('Perplexity AI não está configurado ou está desabilitado.');
                }
            }

            // Método padrão baseado em regras (sem IA) - usado como fallback completo
            this.logger.log('Utilizando refinamento baseado em regras (sem IA) para todos os formatos');
            
            const refinedLayouts = targetFormats.map((targetFormat: BannerSize) => {
                const adaptedElements = elements.map((element: EditorElement) => 
                    this.adaptElementToNewFormat(element, currentFormat, targetFormat)
                );
                return { format: targetFormat, elements: adaptedElements };
            });

            // Salvar os layouts refinados no banco de dados - CADA UM SEPARADAMENTE
            try {
                // Salvar cada layout como um registro separado no banco de dados
                for (const layout of refinedLayouts) {
                    // Criar nomes descritivos para os layouts
                    const layoutName = `${currentFormat.name} → ${layout.format.name}`;
                    const layoutDesc = `Layout convertido de ${currentFormat.width}x${currentFormat.height} para ${layout.format.width}x${layout.format.height}`;
                    
                    // Salvar apenas o layout atual com seu formato e elementos
                    const layoutContent = {
                        format: layout.format,
                        elements: layout.elements
                    };
                    
                    // Criar um novo registro para cada formato
                    await this.layoutService.create({
                        name: layoutName,
                        description: layoutDesc,
                        content: JSON.stringify(layoutContent),
                    });
                    
                    this.logger.log(`Layout para formato ${layout.format.name} (${layout.format.width}x${layout.format.height}) salvo com sucesso`);
                }
                
                this.logger.log(`${refinedLayouts.length} layouts refinados salvos individualmente no banco de dados`);
            } catch (error: any) {
                this.logger.warn(`Erro ao salvar layouts refinados: ${error?.message || 'Erro desconhecido'}`);
                // Continuamos retornando os layouts mesmo se falhar ao salvar
            }

            this.logger.log(`Refinamento concluído com sucesso. Gerados ${refinedLayouts.length} layouts.`);
            return refinedLayouts;
        } catch (error: unknown) {
            this.logger.error(`Erro ao refinar layout: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(`Falha ao refinar layout: ${errorMessage}`);
        }
    }

    /**
     * Refina layouts usando a IA do Perplexity
     */
    private async refineLayoutWithPerplexity(
        currentFormat: BannerSize, 
        elements: EditorElement[], 
        targetFormats: BannerSize[]
    ): Promise<RefinedLayout[]> {
        this.logger.log('🔄 Iniciando chamada à API do Perplexity');
        
        try {
            // Preparar prompt para o Perplexity
            const prompt = this.preparePerplexityPrompt(currentFormat, elements, targetFormats);
            this.logger.debug(`Prompt gerado para Perplexity: ${prompt.substring(0, 100)}...`);
            
            // Log detalhado da requisição que será enviada
            this.logger.log(`Enviando requisição para https://api.perplexity.ai/chat/completions com modelo sonar-pro`);
            
            // Verificar se a API key está definida
            const apiKey = this.configService.perplexityApiKey;
            if (!apiKey) {
                throw new Error('API Key do Perplexity não está configurada');
            }
            
            // Dados da requisição para facilitar debug
            const requestBody = {
                model: 'sonar-pro',
                search_context_size: 'low', // Ajustar para "low" para reduzir custos
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um especialista em design e layout. Sua tarefa é adaptar elementos visuais de um formato para outro, mantendo a estética e proporção.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000
            };
            
            // Fazer a chamada à API do Perplexity
            const startTime = Date.now();
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://api.perplexity.ai/chat/completions',
                    requestBody,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                ).pipe(
                    // Adicionar captura de erros para logar detalhes adicionais
                    catchError((error) => {
                        // Logar detalhes do erro
                        this.logger.error(`⚠️ Erro HTTP ao chamar a API do Perplexity: ${error.message}`);
                        
                        if (error.response) {
                            // Servidor retornou um erro com status
                            this.logger.error(`Response status: ${error.response.status}`);
                            this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
                            throw new Error(`Erro do servidor Perplexity: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                        } else if (error.request) {
                            // Requisição foi feita mas não houve resposta
                            this.logger.error('Sem resposta do servidor Perplexity');
                            throw new Error('Sem resposta do servidor Perplexity');
                        } else {
                            // Erro de configuração
                            throw new Error(`Erro de configuração: ${error.message}`);
                        }
                    })
                )
            );
            
            const requestTime = Date.now() - startTime;
            this.logger.log(`✅ Resposta do Perplexity recebida em ${requestTime}ms`);
            
            // Verificar se a resposta contém os campos esperados
            if (!response.data || !response.data.choices || !response.data.choices[0]) {
                this.logger.error('Resposta da API do Perplexity não contém os campos esperados');
                this.logger.debug(`Resposta: ${JSON.stringify(response.data)}`);
                throw new Error('Resposta da API do Perplexity está em formato inválido');
            }
            
            // Processar resposta do Perplexity
            const aiResponse = response.data.choices[0].message.content;
            this.logger.log(`Resposta do Perplexity recebida: ${aiResponse.substring(0, 100)}...`);
            
            // Processar JSON da resposta
            const layoutsJson = this.tryParseJson(aiResponse, targetFormats);
            if (!layoutsJson) {
                throw new Error('Não foi possível interpretar a resposta da IA.');
            }
            
            return layoutsJson;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Erro desconhecido';
            this.logger.error(`❌ Erro ao usar Perplexity: ${errorMessage}`);
            throw new Error(`Falha ao refinar com Perplexity: ${errorMessage}`);
        }
    }
    
    /**
     * Prepara o prompt para enviar ao Perplexity
     */
    private preparePerplexityPrompt(
        currentFormat: BannerSize,
        elements: EditorElement[],
        targetFormats: BannerSize[]
    ): string {
        return `
        Preciso adaptar um layout de banner para diferentes formatos, mantendo a aparência profissional e bem ajustada em todos os formatos, com máxima fidelidade ao original.
        
        Formato original:
        ${JSON.stringify(currentFormat)}
        
        Elementos do layout original:
        ${JSON.stringify(elements)}
        
        Formatos de destino:
        ${JSON.stringify(targetFormats)}
        
        Regras críticas para adaptação:
        1. ESTRUTURA VISUAL: Preserve a estrutura geral do layout em todos os formatos, mantendo a ordem e disposição relativa dos elementos.
        2. PROPORÇÃO DOS TEXTOS: Ajuste o tamanho dos textos para garantir legibilidade em qualquer formato. Formatos menores devem ter fontes proporcionalmente menores, mas não inferiores a 10px.
        3. EVITAR SOBREPOSIÇÃO: Os elementos NÃO devem se sobrepor ou ficar muito próximos um do outro. Mantenha espaçamento adequado entre elementos.
        4. ESPAÇAMENTO VERTICAL: Distribua elementos verticalmente de forma equilibrada, mantendo proporções de espaçamento consistentes ao layout original.
        5. MANTER IDENTIDADE VISUAL: Cores, fontes e a aparência geral devem ser mantidas em todos os formatos.
        6. PRIORIDADES: Se houver conflito de espaço, priorize o elemento de texto principal, seguido de imagens principais, e depois elementos secundários.
        7. PROPORÇÃO DAS IMAGENS: Preserve a proporção original das imagens para evitar distorções. Não redimensione imagens abaixo de 50% ou acima de 200% do tamanho original.
        8. ALINHAMENTO: Mantenha alinhamentos consistentes em todos os formatos. Ajuste conforme necessário para manter a harmonia visual.
        9. POSICIONAMENTO RELATIVO: Mantenha a posição relativa entre elementos (cabeçalho no topo, rodapé embaixo, etc).
        10. QUEBRA DE TEXTO: Em formatos menores, permita quebras de linha em textos longos, mantendo a legibilidade.
        11. ELEMENTOS RESPONSIVOS: Alguns elementos podem mudar de tamanho ou posição para melhor se adequar a cada formato.
        12. CONSISTÊNCIA ENTRE FORMATOS: Garanta que todos os formatos mantenham uma aparência consistente entre si, não apenas em relação ao original.
        13. TRATAMENTO DE ESPAÇOS VAZIOS: Distribua elementos de forma a evitar grandes espaços vazios em formatos maiores ou aglomerações em formatos menores.
        14. VERIFICAÇÃO FINAL: Certifique-se de que todos os elementos estejam visíveis, legíveis e bem posicionados em cada formato antes de finalizar.
        
        INSTRUÇÕES ESPECÍFICAS DE FORMATO JSON:
        Sua resposta DEVE ser um array de layouts no formato JSON estritamente válido.
        
        [
          {
            "format": {...primeiro formato de destino...},
            "elements": [...elementos adaptados para este formato...]
          },
          {
            "format": {...segundo formato de destino...},
            "elements": [...elementos adaptados para este formato...]
          }
        ]
        
        Certifique-se de colocar colchetes [...] ao redor de todos os objetos de layout para formar um array válido.
        
        Para cada elemento, mantenha o ID original mas adicione o sufixo do nome do formato (em minúsculas e simplificado), e inclua uma propriedade "originalId" com o ID original.
        
        REQUISITOS OBRIGATÓRIOS DE FORMATAÇÃO:
        1. Para cada "style", NÃO coloque vírgula após a última propriedade de um objeto
        2. O JSON DEVE ser um array válido e completo com colchetes no início e fim
        3. Cada propriedade DEVE ter aspas duplas (")
        4. Todos os elementos devem ter as propriedades: id, type, content, style, sizeId (igual ao nome do formato), originalId
        5. Não use campos undefined ou null - simplesmente omita propriedades opcionais
        6. Garanta que o último elemento de cada array e objeto não tenha vírgula no final
        
        EXEMPLOS DE ADAPTAÇÕES ESPECÍFICAS:
        - Para texto: Reduza o tamanho da fonte proporcionalmente em formatos menores, mas mantenha um mínimo de 10px
        - Para imagens: Mantenha a proporção e redimensione adequadamente, sem ultrapassar 50% de redução ou 200% de aumento
        - Para logos: Garanta visibilidade mínima adequada, nunca menor que 20px em sua menor dimensão
        
        Muito importante: TESTE seu JSON antes de enviar para garantir que é válido e não tem erros de formatação!
        `;
    }

    private adaptElementToNewFormat(
        element: EditorElement,
        currentFormat: BannerSize,
        targetFormat: BannerSize
    ): EditorElement {
        // Gerar um novo ID para o elemento adaptado
        const newId = `${element.id}-${targetFormat.name.toLowerCase().replace(/\s+/g, '-')}`;

        // Calcular as proporções entre os formatos
        const widthRatio = targetFormat.width / currentFormat.width;
        const heightRatio = targetFormat.height / currentFormat.height;
        const smallerRatio = Math.min(widthRatio, heightRatio);

        // Aplicar diferentes regras de adaptação com base no tipo de elemento
        let adaptedElement: EditorElement = {
            ...element,
            id: newId,
            originalId: element.id, // Manter referência para o elemento original
            sizeId: targetFormat.name,
            style: { ...element.style }
        };

        // Diferentes regras para diferentes tipos de elementos
        if (element.type === 'text') {
            // Para textos, usar uma escala mais conservadora para evitar exageros
            const textScaleFactor = smallerRatio * 0.95; // Ligeira redução para evitar textos grandes demais
            
            // Adaptar posição mantendo alinhamentos
            if (element.style.x <= 10) {
                // Se estiver próximo à borda esquerda, manter colado
                adaptedElement.style.x = element.style.x;
            } else if (element.style.x + element.style.width >= currentFormat.width - 10) {
                // Se estiver próximo à borda direita, manter essa relação
                adaptedElement.style.x = targetFormat.width - (element.style.width * widthRatio);
            } else {
                // Caso contrário, manter proporção
                adaptedElement.style.x = Math.max(0, element.style.x * widthRatio);
            }
            
            // Ajustar altura vertical com cuidado para não sobrepor
            adaptedElement.style.y = Math.max(0, element.style.y * heightRatio);
            
            // Ajustar largura, mas garantir um mínimo legível
            adaptedElement.style.width = Math.max(100, element.style.width * widthRatio);
            
            // Altura pode ser ajustada mais livremente para textos
            adaptedElement.style.height = Math.max(20, element.style.height * textScaleFactor);

            // Ajustar o tamanho da fonte com escala mais inteligente
            if (element.style.fontSize) {
                // Para formatos pequenos, evitar fontes muito pequenas
                const minFontSize = 14; // Garantir legibilidade mínima
                const maxFontSize = 72; // Limite superior para evitar textos gigantes
                
                // Escala mais suave para o texto
                const fontSize = element.style.fontSize * textScaleFactor;
                
                // Aplicar limites
                adaptedElement.style.fontSize = Math.max(minFontSize, Math.min(maxFontSize, fontSize));
                
                // Para elementos com nomes específicos como títulos ou cabeçalhos, ajustar valores customizados
                if (element.id.toLowerCase().includes('title') || element.id.toLowerCase().includes('header')) {
                    // Títulos/cabeçalhos podem ter fontes maiores
                    adaptedElement.style.fontSize = Math.max(18, adaptedElement.style.fontSize);
                }
                
                // Para textos menores como rodapés ou descrições
                if (element.id.toLowerCase().includes('footer') || element.id.toLowerCase().includes('description')) {
                    // Garantir que não fiquem muito grandes
                    adaptedElement.style.fontSize = Math.min(adaptedElement.style.fontSize, 16);
                }
            }
            
            // Manter o alinhamento do texto
            adaptedElement.style.alignment = element.style.alignment;
        }
        else if (element.type === 'image') {
            // Imagens: manter proporção e preservar alinhamento com as bordas
            const aspectRatio = element.style.width / element.style.height;
            
            // Detectar se a imagem está colada em alguma borda no layout original
            const isStickingToLeftBorder = element.style.x <= 5;  // Tolerância de 5px
            const isStickingToRightBorder = element.style.x + element.style.width >= currentFormat.width - 5;
            const isStickingToTopBorder = element.style.y <= 5;
            const isStickingToBottomBorder = element.style.y + element.style.height >= currentFormat.height - 5;
            
            // Identificar se a imagem é provavelmente um logo ou banner principal
            const isLogo = element.id.toLowerCase().includes('logo') || 
                          (element.style.width < currentFormat.width * 0.3 && 
                           element.style.height < currentFormat.height * 0.2);
            
            const isBanner = element.style.width >= currentFormat.width * 0.9 || 
                            element.style.height >= currentFormat.height * 0.3;
            
            if (isLogo) {
                // Logos devem manter tamanho relativo e posição
                const logoScale = smallerRatio * 0.9; // Leve redução para logos
                adaptedElement.style.width = element.style.width * logoScale;
                adaptedElement.style.height = element.style.height * logoScale;
                
                // Manter posicionamento relativo do logo
                if (isStickingToLeftBorder && isStickingToTopBorder) {
                    // Logo no canto superior esquerdo
                    adaptedElement.style.x = 5;
                    adaptedElement.style.y = 5;
                } else if (isStickingToRightBorder && isStickingToTopBorder) {
                    // Logo no canto superior direito
                    adaptedElement.style.x = targetFormat.width - adaptedElement.style.width - 5;
                    adaptedElement.style.y = 5;
                } else if (isStickingToLeftBorder && isStickingToBottomBorder) {
                    // Logo no canto inferior esquerdo
                    adaptedElement.style.x = 5;
                    adaptedElement.style.y = targetFormat.height - adaptedElement.style.height - 5;
                } else if (isStickingToRightBorder && isStickingToBottomBorder) {
                    // Logo no canto inferior direito
                    adaptedElement.style.x = targetFormat.width - adaptedElement.style.width - 5;
                    adaptedElement.style.y = targetFormat.height - adaptedElement.style.height - 5;
                } else {
                    // Posição relativa para logos em outras posições
                    const relativeX = element.style.x / currentFormat.width;
                    const relativeY = element.style.y / currentFormat.height;
                    adaptedElement.style.x = relativeX * targetFormat.width;
                    adaptedElement.style.y = relativeY * targetFormat.height;
                }
            } else if (isBanner) {
                // Banners grandes devem se adaptar ao formato
                if (isStickingToTopBorder) {
                    // Banner de topo
                    adaptedElement.style.x = 0;
                    adaptedElement.style.y = 0;
                    adaptedElement.style.width = targetFormat.width;
                    // Manter proporção para altura
                    adaptedElement.style.height = Math.min(
                        targetFormat.height * 0.3,
                        targetFormat.width / aspectRatio
                    );
                } else if (isStickingToBottomBorder) {
                    // Banner de rodapé
                    adaptedElement.style.x = 0;
                    adaptedElement.style.width = targetFormat.width;
                    adaptedElement.style.height = Math.min(
                        targetFormat.height * 0.3,
                        targetFormat.width / aspectRatio
                    );
                    adaptedElement.style.y = targetFormat.height - adaptedElement.style.height;
                } else {
                    // Banner central
                    adaptedElement.style.width = targetFormat.width * 0.95;
                    adaptedElement.style.height = adaptedElement.style.width / aspectRatio;
                    // Centralizar
                    adaptedElement.style.x = (targetFormat.width - adaptedElement.style.width) / 2;
                    // Manter posição vertical relativa
                    const relativeY = element.style.y / currentFormat.height;
                    adaptedElement.style.y = relativeY * targetFormat.height;
                }
            } else {
                // Imagens normais: manter proporção e adaptar tamanho
                // Determinar se a limitação é largura ou altura
                if (widthRatio < heightRatio) {
                    // Limitado pela largura
                    const newWidth = Math.min(targetFormat.width * 0.9, element.style.width * widthRatio);
                    const newHeight = newWidth / aspectRatio;
                    
                    adaptedElement.style.width = newWidth;
                    adaptedElement.style.height = newHeight;
                } else {
                    // Limitado pela altura
                    const newHeight = Math.min(targetFormat.height * 0.7, element.style.height * heightRatio);
                    const newWidth = newHeight * aspectRatio;
                    
                    adaptedElement.style.height = newHeight;
                    adaptedElement.style.width = newWidth;
                }
                
                // Preservar posicionamento relativo
                const relativeX = element.style.x / currentFormat.width;
                const relativeY = element.style.y / currentFormat.height;
                adaptedElement.style.x = relativeX * targetFormat.width;
                adaptedElement.style.y = relativeY * targetFormat.height;
                
                // Garantir que a imagem não ultrapasse os limites do canvas
                if (adaptedElement.style.x + adaptedElement.style.width > targetFormat.width) {
                    adaptedElement.style.x = Math.max(0, targetFormat.width - adaptedElement.style.width);
                }
                
                if (adaptedElement.style.y + adaptedElement.style.height > targetFormat.height) {
                    adaptedElement.style.y = Math.max(0, targetFormat.height - adaptedElement.style.height);
                }
            }
        }
        else if (element.type === 'container') {
            // Containers: ajustar proporcionalmente mas garantir que caiba no novo formato
            adaptedElement.style.x = Math.max(0, element.style.x * widthRatio);
            adaptedElement.style.y = Math.max(0, element.style.y * heightRatio);

            // Ajustar tamanho proporcionalmente com limites
            adaptedElement.style.width = Math.min(
                targetFormat.width * 0.95,
                Math.max(100, element.style.width * widthRatio)
            );

            adaptedElement.style.height = Math.min(
                targetFormat.height * 0.95,
                Math.max(100, element.style.height * heightRatio)
            );

            // Garantir que o container não saia do canvas
            adaptedElement.style.x = Math.min(adaptedElement.style.x, targetFormat.width - adaptedElement.style.width);
            adaptedElement.style.y = Math.min(adaptedElement.style.y, targetFormat.height - adaptedElement.style.height);
        }
        else {
            // Padrão para outros tipos de elementos
            adaptedElement.style.x = Math.max(0, element.style.x * widthRatio);
            adaptedElement.style.y = Math.max(0, element.style.y * heightRatio);
            adaptedElement.style.width = Math.max(20, element.style.width * widthRatio);
            adaptedElement.style.height = Math.max(20, element.style.height * heightRatio);

            // Garantir que o elemento não saia do canvas
            adaptedElement.style.x = Math.min(adaptedElement.style.x, targetFormat.width - adaptedElement.style.width);
            adaptedElement.style.y = Math.min(adaptedElement.style.y, targetFormat.height - adaptedElement.style.height);
        }

        // Limpar propriedades de porcentagem
        adaptedElement.style.xPercent = undefined;
        adaptedElement.style.yPercent = undefined;
        adaptedElement.style.widthPercent = undefined;
        adaptedElement.style.heightPercent = undefined;

        return adaptedElement;
    }

    private tryParseJson(jsonString: string, targetFormats: BannerSize[]): any {
        try {
            // Tentar extrair JSON de blocos de código
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    return JSON.parse(jsonMatch[1]);
                } catch (e) {
                    // Ignorar erro e continuar
                }
            }
            
            // Tentar encontrar e extrair array diretamente
            const arrayMatch = jsonString.match(/\[\s*\{\s*"format"/s);
            if (arrayMatch) {
                const startIndex = jsonString.indexOf('[');
                if (startIndex !== -1) {
                    let depth = 0;
                    let endIndex = startIndex;
                    
                    for (let i = startIndex; i < jsonString.length; i++) {
                        if (jsonString[i] === '[') depth++;
                        else if (jsonString[i] === ']') depth--;
                        
                        if (depth === 0) {
                            endIndex = i + 1;
                            break;
                        }
                    }
                    
                    if (endIndex > startIndex) {
                        const jsonStr = jsonString.substring(startIndex, endIndex);
                        try {
                            return JSON.parse(jsonStr);
                        } catch (e) {
                            // Ignorar erro e continuar
                        }
                    }
                }
            }
            
            // Tentar parse direto
            try {
                const parsed = JSON.parse(jsonString);
                
                // Normalizar para array se for objeto
                if (!Array.isArray(parsed)) {
                    // Se é um objeto de layout válido
                    if (parsed && typeof parsed === 'object' && 'format' in parsed && 'elements' in parsed) {
                        return [parsed]; 
                    }
                    
                    // Se contém array em alguma propriedade
                    for (const key in parsed) {
                        const value = parsed[key];
                        if (Array.isArray(value)) {
                            return value;
                        }
                    }
                    
                    // Tentar extrair layouts de objetos aninhados
                    const layoutsArray: RefinedLayout[] = [];
                    const targetFormatNames = targetFormats.map(f => f.name);
                    
                    for (const key in parsed) {
                        const item = parsed[key];
                        if (item && typeof item === 'object') {
                            // Verificar se a chave corresponde a um formato alvo
                            if (targetFormatNames.includes(key) && 'elements' in item) {
                                layoutsArray.push({
                                    format: targetFormats.find((f: BannerSize) => f.name === key) as BannerSize,
                                    elements: item.elements
                                });
                            } else if ('format' in item && 'elements' in item) {
                                layoutsArray.push(item);
                            }
                        }
                    }
                    
                    if (layoutsArray.length > 0) {
                        return layoutsArray;
                    }
                }
                
                return parsed;
            } catch (e) {
                // Falha em todas as tentativas
                throw new Error('Não foi possível extrair JSON válido da resposta');
            }
        } catch (error) {
            this.logger.error(`Erro ao analisar JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return null;
        }
    }

    private tryFixJsonStructure(jsonString: string): string {
        // Implementar correções comuns de estrutura JSON
        let fixedJson = jsonString;
        
        // Corrigir vírgulas extras antes de fechar objetos ou arrays
        fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
        
        // Corrigir propriedades sem aspas (comum nas respostas da IA)
        fixedJson = fixedJson.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
        
        // Corrigir valores numéricos com vírgula em vez de ponto (ptBR)
        fixedJson = fixedJson.replace(/"([^"]+)":\s*"(\d+),(\d+)"/g, '"$1": $2.$3');
        
        // Adicionar aspas em valores que deveriam ser strings mas estão sem aspas
        fixedJson = fixedJson.replace(/:\s*([a-zA-Z][a-zA-Z0-9_\s]+)([,}\]])/g, ': "$1"$2');
        
        // Remover aspas extras em valores numéricos
        fixedJson = fixedJson.replace(/"([^"]+)":\s*"(\d+(\.\d+)?)"([,}\]])/g, '"$1": $2$4');
        
        // Remover campos undefined ou null para evitar erros
        fixedJson = fixedJson.replace(/"[^"]+": (undefined|null),?/g, '');
        
        return fixedJson;
    }
}
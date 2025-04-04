import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BannerSize, EditorElement, RefinedLayout } from '../interfaces/layout.interface';
import { LayoutAdapterUtils } from '../utils/layout-adapter.utils';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class PerplexityService {
    private readonly logger = new Logger(PerplexityService.name);
    private readonly iaProvider: string; // Define o provedor de IA (chatgpt, perplexity, gemini ou false)
    private readonly googleGenAI: GoogleGenAI;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.iaProvider = this.configService.get<string>('USE_IA') || 'false'; // Pega o provedor de IA ou 'false' por padrão
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        this.googleGenAI = new GoogleGenAI({ apiKey });

        const hasApiKey = !!apiKey;
        const isEnabled = this.isAIEnabled();

        this.logger.log(`${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity AI' : this.iaProvider === 'gemini' ? 'Gemini' : 'Nenhuma IA'} ${isEnabled ? 'habilitado' : 'desabilitado'} (API Key ${hasApiKey ? 'configurada' : 'não configurada'})`);

        if (isEnabled && !hasApiKey) {
            this.logger.warn(`${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity AI' : 'Gemini'} está habilitado, mas a API Key não está configurada. Configure a API_KEY no arquivo .env`);
        }

        // Configurar timeout maior para evitar erros de timeout
        this.httpService.axiosRef.defaults.timeout = 120000; // 120 segundos
    }

    private getApiKey(): string {
        return this.iaProvider === 'chatgpt'
            ? 'CHATGPT_API_KEY'
            : this.iaProvider === 'perplexity'
                ? 'PERPLEXITY_API_KEY'
                : this.iaProvider === 'gemini'
                    ? 'GEMINI_API_KEY'
                    : '';
    }

    isAIEnabled(): boolean {
        const apiKey = this.configService.get<string>(this.getApiKey());
        const isEnabled = this.iaProvider !== 'false' && !!apiKey;

        // Logs detalhados para depuração
        this.logger.log(`🔍 Verificando se IA está habilitada:`);
        this.logger.log(`Provedor de IA configurado: ${this.iaProvider}`);
        this.logger.log(`Chave da API configurada: ${!!apiKey}`);
        this.logger.log(`IA habilitada: ${isEnabled}`);

        if (!apiKey) {
            this.logger.warn(`⚠️ Chave da API para ${this.iaProvider} não está configurada.`);
        }
        if (this.iaProvider === 'false') {
            this.logger.warn(`⚠️ Provedor de IA está desabilitado.`);
        }

        return isEnabled;
    }

    async refineLayoutWithPerplexity(
        currentFormat: BannerSize,
        elements: EditorElement[],
        targetFormats: BannerSize[]
    ): Promise<RefinedLayout[]> {
        if (!this.isAIEnabled()) {
            this.logger.log('⚠️ IA desabilitada ou API key não configurada. Usando adaptação baseada em regras.');
            return this.applyRuleBasedAdaptation(currentFormat, elements, targetFormats);
        }

        this.logger.log('🔄 Iniciando processo de refinamento com IA');
        const startTime = Date.now();

        try {
            const apiKey = this.configService.get<string>(this.getApiKey());
            if (!apiKey) {
                throw new Error('Chave da API não configurada.');
            }

            const refinedLayouts: RefinedLayout[] = [];
            const batches = this.splitIntoBatches(targetFormats, 5);

            for (const batch of batches) {
                this.logger.log(`📦 Processando lote com ${batch.length} formatos.`);
                const prompt = this.preparePerplexityPrompt(currentFormat, elements, batch);
                const response = await this.callPerplexityAPI(prompt);

                const aiResponse = response.choices[0]?.message?.content || '';
                const parsedLayouts = this.tryParseJson(aiResponse, batch);

                if (parsedLayouts && Array.isArray(parsedLayouts)) {
                    const validatedLayouts = this.validateLayoutsFromAI(parsedLayouts, batch);
                    refinedLayouts.push(...validatedLayouts);
                } else {
                    this.logger.warn('⚠️ Falha ao processar resposta da IA. Usando adaptação baseada em regras.');
                    refinedLayouts.push(...this.applyRuleBasedAdaptation(currentFormat, elements, batch));
                }
            }

            this.logger.log(`✅ Refinamento com IA concluído. Total de layouts gerados: ${refinedLayouts.length}`);
            return refinedLayouts;

        } catch (error) {
            this.logger.error(`❌ Erro ao processar com IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            this.logger.log('⚠️ Usando adaptação baseada em regras como fallback.');
            return this.applyRuleBasedAdaptation(currentFormat, elements, targetFormats);
        }
    }

    private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    private async callPerplexityAPI(prompt: string): Promise<any> {
        const apiKey = this.configService.get<string>(this.getApiKey());
        if (!apiKey) {
            throw new Error(`${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity' : 'Gemini'} API Key não está configurada`);
        }

        if (this.iaProvider === 'gemini') {
            try {
                this.logger.log('Enviando requisição para Gemini API usando @google/genai');
                const response = await this.googleGenAI.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: prompt,
                });

                this.logger.log('Resposta recebida da API Gemini com sucesso');
                return {
                    choices: [{
                        message: {
                            content: response.text,
                        },
                    }],
                };
            } catch (error) {
                this.logger.error(`Erro na chamada à API Gemini: ${error.message}`);
                throw new Error(`Erro na API Gemini: ${error.message}`);
            }
        }

        let requestBody, apiUrl, headers;

        if (this.iaProvider === 'chatgpt') {
            requestBody = {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'Você é um especialista em design e layout. Sua tarefa é adaptar elementos visuais de um formato para outro, mantendo a estética e proporção.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2000
            };
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
        }
        else if (this.iaProvider === 'perplexity') {
            requestBody = {
                model: 'sonar-pro',
                search_context_size: 'low',
                messages: [
                    { role: 'system', content: 'Você é um especialista em design e layout. Sua tarefa é adaptar elementos visuais de um formato para outro, mantendo a estética e proporção.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2000
            };
            apiUrl = 'https://api.perplexity.ai/chat/completions';
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
        }

        this.logger.log(`Enviando requisição para ${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity' : 'Gemini'} API`);

        try {
            const response = await firstValueFrom(
                this.httpService.post(apiUrl, requestBody, { headers }).pipe(
                    catchError((error) => {
                        this.logger.error(`Erro na chamada à API ${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity' : 'Gemini'}: ${error.message}`);
                        throw error;
                    })
                )
            );

            this.logger.log(`Resposta recebida da API ${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity' : 'Gemini'} com sucesso`);

            return response.data;
        } catch (error) {
            this.logger.error(`Falha na comunicação com API ${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity' : 'Gemini'}: ${error.message}`);
            throw new Error(`Erro na API ${this.iaProvider === 'chatgpt' ? 'ChatGPT' : this.iaProvider === 'perplexity' ? 'Perplexity' : 'Gemini'}: ${error.message}`);
        }
    }

    private preparePerplexityPrompt(
        currentFormat: BannerSize,
        elements: EditorElement[],
        targetFormats: BannerSize[]
    ): string {
        const simplifiedElements = elements.map(({ id, type, style }) => ({ id, type, style }));
        const simplifiedTargetFormats = targetFormats.map(({ name, width, height }) => ({ name, width, height }));

        if (this.iaProvider === 'gemini') {
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
            15. LOGOS E BOTÕES EM IMAGEM: Sempre use os containers das imagens identificadas como logos ou imagem como object-fit: contain, para garantir que a imagem não seja distorcida e não corte parte da imagem.
            16. ORIENTAÇÕES DIFERENTES: Se o formato de destino tiver uma orientação diferente (paisagem ou retrato), ajuste os elementos para se adequarem à nova orientação, mantendo a legibilidade e estética.
            17. DISPOSIÇÃO DE ELEMENTOS EM DIFERENTES ORIENTAÇÕES: Podemos imaginar a orientação vertical dividido ao meio no eixo Y em 2 partes. Ao transformar em um layout horizontal, vamos dividir em 2 partes no eixo X. Assim, os elementos que estão na parte superior do layout original devem ser colocados na parte esquerda do layout horizontal, e os elementos da parte inferior devem ser colocados na parte direita do layout horizontal. Isso garante que a disposição dos elementos seja mantida de forma lógica e visualmente agradável.
            18. CONCEITOS PARA USAR: Use conceitos como "layout responsivo", "design adaptativo" e "proporção áurea" para garantir que os elementos sejam ajustados de forma harmoniosa e esteticamente agradável em todos os formatos.
            19. USE GESTALT: Para ajudar na identificação de quais elementos devem permanecer juntos ou não, use os princípios da Gestalt, como proximidade e similaridade. Exemplo: Para textos juntos no layout original devem permanecer juntos, use o princípio da proximidade. 


            INSTRUÇÕES ESPECÍFICAS DE FORMATO JSON:
            Sua resposta DEVE ser um array de layouts no formato JSON estritamente válido.

            [
              {
                "format": { "name": "nome do formato", "width": largura, "height": altura },
                "elements": [
                  {
                    "id": "id do elemento",
                    "originalId": "id original",
                    "type": "tipo do elemento",
                    "content": "conteúdo do elemento (se aplicável)",
                    "style": { 
                      "x": posiçãoX, 
                      "y": posiçãoY, 
                      "width": largura, 
                      "height": altura, 
                      "rotation": rotação, 
                      "opacity": opacidade 
                    }
                  }
                ]
              }
            ]

            Instruções importantes:
            - Não inclua explicações ou texto adicional fora do JSON.
            - Use apenas aspas duplas para propriedades e valores.
            - Certifique-se de que o JSON seja estritamente válido.
            - Teste o JSON antes de enviar para garantir que não há erros de formatação.
            `;
        }

        // Prompt padrão para outros provedores
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
            15. LOGOS E BOTÕES EM IMAGEM: Sempre use os containers das imagens identificadas como logos ou imagem como object-fit: contain, para garantir que a imagem não seja distorcida e não corte parte da imagem.
            16. ORIENTAÇÕES DIFERENTES: Se o formato de destino tiver uma orientação diferente (paisagem ou retrato), ajuste os elementos para se adequarem à nova orientação, mantendo a legibilidade e estética.
            17. DISPOSIÇÃO DE ELEMENTOS EM DIFERENTES ORIENTAÇÕES: Podemos imaginar a orientação vertical dividido ao meio no eixo Y em 2 partes. Ao transformar em um layout horizontal, vamos dividir em 2 partes no eixo X. Assim, os elementos que estão na parte superior do layout original devem ser colocados na parte esquerda do layout horizontal, e os elementos da parte inferior devem ser colocados na parte direita do layout horizontal. Isso garante que a disposição dos elementos seja mantida de forma lógica e visualmente agradável.
            18. CONCEITOS PARA USAR: Use conceitos como "layout responsivo", "design adaptativo" e "proporção áurea" para garantir que os elementos sejam ajustados de forma harmoniosa e esteticamente agradável em todos os formatos.
            19. USE GESTALT: Para ajudar na identificação de quais elementos devem permanecer juntos ou não, use os princípios da Gestalt, como proximidade e similaridade. Exemplo: Para textos juntos no layout original devem permanecer juntos, use o princípio da proximidade. 

        INSTRUÇÕES ESPECÍFICAS DE FORMATO JSON:
        Sua resposta DEVE ser um array de layouts no formato JSON estritamente válido.

        [
              {
                "format": { "name": "nome do formato", "width": largura, "height": altura },
                "elements": [
                  {
                    "id": "id do elemento",
                    "originalId": "id original",
                    "type": "tipo do elemento",
                    "content": "conteúdo do elemento (se aplicável)",
                    "style": { 
                      "x": posiçãoX, 
                      "y": posiçãoY, 
                      "width": largura, 
                      "height": altura, 
                      "rotation": rotação, 
                      "opacity": opacidade 
                    }
                  }
                ]
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

        Muito importante: TESTE seu JSON antes de enviar para garantir que é válido e não tem erros de formatação!
        `;
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

    private validateLayoutsFromAI(layouts: any[], targetFormats: BannerSize[]): RefinedLayout[] {
        const validLayouts: RefinedLayout[] = [];

        for (const layout of layouts) {
            // Verificar se o layout tem o formato correto
            if (!layout.format || !layout.elements || !Array.isArray(layout.elements)) {
                this.logger.warn('Layout inválido retornado pela IA: formato incorreto');
                continue;
            }

            // Verificar se o formato corresponde a um dos formatos alvo
            const matchingFormat = targetFormats.find(
                format => format.name === layout.format.name
            );

            if (!matchingFormat) {
                this.logger.warn(`Formato "${layout.format.name}" não encontrado nos formatos alvo`);
                continue;
            }

            // Verificar se todos os elementos têm as propriedades necessárias
            let validElements = true;
            for (const element of layout.elements) {
                if (!element.id || !element.type || !element.content || !element.style) {
                    this.logger.warn('Elemento inválido encontrado no layout');
                    validElements = false;
                    break;
                }
            }

            if (!validElements) continue;

            // Se passou em todas as validações, adicionar à lista de layouts válidos
            validLayouts.push({
                format: matchingFormat,
                elements: layout.elements
            });
        }

        return validLayouts;
    }

    private applyRuleBasedAdaptation(
        currentFormat: BannerSize,
        elements: EditorElement[],
        targetFormats: BannerSize[]
    ): RefinedLayout[] {
        this.logger.log('Aplicando adaptação baseada em regras para os formatos');

        return targetFormats.map(targetFormat => {
            // Log detalhado para diagnóstico
            this.logger.log(`Adaptando para formato ${targetFormat.name} (${targetFormat.width}x${targetFormat.height})`);

            const adaptedElements = elements.map(element => {
                // Usar o LayoutAdapterUtils para adaptar cada elemento
                const adapted = LayoutAdapterUtils.adaptElementToNewFormat(element, currentFormat, targetFormat);

                // Log para diagnóstico
                this.logger.debug(`Elemento ${element.id} adaptado: ${JSON.stringify({
                    original: { x: element.style.x, y: element.style.y, width: element.style.width, height: element.style.height },
                    adapted: { x: adapted.style.x, y: adapted.style.y, width: adapted.style.width, height: adapted.style.height }
                })}`);

                return adapted;
            });

            return {
                format: targetFormat,
                elements: adaptedElements
            };
        });
    }
}

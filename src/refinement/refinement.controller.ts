import { Controller, Post, Body, Logger } from '@nestjs/common';
import { RefinementService } from './refinement.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

// Importando ou redefinindo a interface RefinedLayout
interface BannerSize {
    name: string;
    width: number;
    height: number;
    orientation?: 'vertical' | 'horizontal' | 'square';
}

interface RefinedLayout {
    format: BannerSize;
    elements: any[];
}

@ApiTags('refinement')
@Controller('refinement')
export class RefinementController {
    private readonly logger = new Logger(RefinementController.name);

    constructor(private readonly refinementService: RefinementService) { }

    @Post('refine-layout')
    @ApiOperation({ summary: 'Refina layouts para diferentes formatos' })
    @ApiBody({ description: 'Dados do layout para refinamento' })
    async refineLayout(@Body() layoutData: any): Promise<RefinedLayout[]> {
        try {
            this.logger.log(`Recebendo requisição para refinar layout: ${JSON.stringify(layoutData).substring(0, 100)}...`);

            // Verificando se layoutData está definido
            if (!layoutData) {
                throw new Error('Dados do layout não fornecidos');
            }

            // Verificando propriedades obrigatórias
            if (!layoutData.currentFormat) {
                throw new Error('Formato atual (currentFormat) não fornecido');
            }

            if (!layoutData.elements || !Array.isArray(layoutData.elements)) {
                throw new Error('Elementos do layout não fornecidos ou inválidos');
            }

            if (!layoutData.targetFormats || !Array.isArray(layoutData.targetFormats)) {
                throw new Error('Formatos de destino não fornecidos ou inválidos');
            }

            return await this.refinementService.refineLayout(layoutData);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`Erro ao processar requisição: ${errorMessage}`);
            throw error;
        }
    }
}
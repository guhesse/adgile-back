import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RefinementService, RefinedLayout } from '../services/refinement.service';

@ApiTags('refinement')
@Controller('ai')
export class RefinementController {
    private readonly logger = new Logger(RefinementController.name);

    constructor(private readonly refinementService: RefinementService) { }

    @ApiOperation({ summary: 'Refinar layout para diferentes formatos' })
    @ApiResponse({ status: 200, description: 'Layouts refinados com sucesso' })
    @Post('refine-layouts')
    async refineLayouts(@Body() layoutData: any): Promise<RefinedLayout[]> {
        this.logger.log(`Recebida solicitação para refinar layout com ${layoutData.elements?.length} elementos para ${layoutData.targetFormats?.length} formatos`);
        return this.refinementService.refineLayout(layoutData);
    }

    @ApiOperation({ summary: 'Gerar layout com base em um prompt' })
    @ApiResponse({ status: 200, description: 'Layout gerado com sucesso' })
    @Post('generate-layout')
    async generateLayout(@Body() data: { prompt: string, userId?: string }) {
        this.logger.log(`Recebida solicitação para gerar layout com prompt: ${data.prompt.substring(0, 50)}...`);
        return this.refinementService.generateLayout(data.prompt, data.userId);
    }
}

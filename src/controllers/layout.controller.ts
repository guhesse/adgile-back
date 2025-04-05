import { Controller, Get, Post, Body, Put, Param, Delete, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LayoutService } from '../services/layout.service';
import { CreateLayoutDto } from '../dtos/create-layout.dto';

@ApiTags('layouts')
@Controller('layouts')
export class LayoutController {
    private readonly logger = new Logger(LayoutController.name);

    constructor(
        private readonly layoutService: LayoutService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all layouts' })
    @ApiResponse({ status: 200, description: 'Returns all layouts' })
    @ApiQuery({ name: 'tenantId', required: false, type: Number })
    async findAll(@Query('tenantId') tenantId?: number) {
        this.logger.log(`Buscando layouts${tenantId ? ` para tenant ${tenantId}` : ''}`);
        return this.layoutService.findAll(tenantId ? +tenantId : undefined);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get layout by ID' })
    @ApiResponse({ status: 200, description: 'Returns a layout by ID' })
    async findById(@Param('id') id: string) {
        return this.layoutService.findById(+id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new layout' })
    @ApiResponse({ status: 201, description: 'Layout created successfully' })
    async create(@Body() createLayoutDto: CreateLayoutDto) {
        this.logger.log(`Criando novo layout: ${createLayoutDto.name}, categoria: ${createLayoutDto.categoryId || 'nenhuma'}`);
        return this.layoutService.create(createLayoutDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a layout' })
    @ApiResponse({ status: 200, description: 'Layout updated successfully' })
    async update(@Param('id') id: string, @Body() updateLayoutDto: Partial<CreateLayoutDto>) {
        return this.layoutService.update(+id, updateLayoutDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a layout' })
    @ApiResponse({ status: 200, description: 'Layout deleted successfully' })
    async remove(@Param('id') id: string) {
        return this.layoutService.remove(+id);
    }

    @Get('category/:categoryId')
    @ApiOperation({ summary: 'Get layouts by category ID' })
    @ApiResponse({ status: 200, description: 'Returns layouts by category ID' })
    async findByCategoryId(@Param('categoryId') categoryId: string) {
        // Agora podemos simplesmente usar o categoryId como string diretamente
        return this.layoutService.findByCategoryString(categoryId);
    }
}

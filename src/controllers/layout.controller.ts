import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { LayoutService } from '../services/layout.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateLayoutDto, UpdateLayoutDto, LayoutResponseDto } from '../dtos/layout.dto';

@ApiTags('layouts')
@Controller('layouts')
export class LayoutController {
  constructor(private layoutService: LayoutService) {}

  @ApiOperation({ summary: 'Obter todos os layouts' })
  @ApiResponse({ status: 200, description: 'Lista de layouts retornada com sucesso', type: [LayoutResponseDto] })
  @Get()
  findAll() {
    return this.layoutService.findAll();
  }

  @ApiOperation({ summary: 'Obter layout por ID' })
  @ApiResponse({ status: 200, description: 'Layout encontrado com sucesso', type: LayoutResponseDto })
  @ApiResponse({ status: 404, description: 'Layout não encontrado' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.layoutService.findById(+id);
  }

  @ApiOperation({ summary: 'Criar novo layout' })
  @ApiResponse({ status: 201, description: 'Layout criado com sucesso', type: LayoutResponseDto })
  @Post()
  create(@Body() createLayoutDto: CreateLayoutDto) {
    return this.layoutService.create(createLayoutDto);
  }

  @ApiOperation({ summary: 'Atualizar layout existente' })
  @ApiResponse({ status: 200, description: 'Layout atualizado com sucesso', type: LayoutResponseDto })
  @ApiResponse({ status: 404, description: 'Layout não encontrado' })
  @Put(':id')
  update(@Param('id') id: string, @Body() updateLayoutDto: UpdateLayoutDto) {
    return this.layoutService.update(+id, updateLayoutDto);
  }

  @ApiOperation({ summary: 'Remover layout' })
  @ApiResponse({ status: 200, description: 'Layout removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Layout não encontrado' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.layoutService.remove(+id);
  }

  @ApiOperation({ summary: 'Obter layouts por categoria' })
  @ApiResponse({ status: 200, description: 'Lista de layouts retornada com sucesso', type: [LayoutResponseDto] })
  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.layoutService.findByCategoryId(+categoryId);
  }
}

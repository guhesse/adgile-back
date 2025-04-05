import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateLayoutDto {
  @ApiProperty({ description: 'Nome do layout' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Descrição do layout' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Conteúdo do layout em formato JSON' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Categoria do layout (string identificadora)' })
  @IsString()
  @IsOptional()
  categoryId?: string; // Alterado para string

  @ApiPropertyOptional({ description: 'ID do tenant' })
  @IsInt()
  @IsOptional()
  tenantId?: number;

  @ApiPropertyOptional({ description: 'ID do usuário criador' })
  @IsInt()
  @IsOptional()
  createdBy?: number;
}

export class UpdateLayoutDto {
  @ApiPropertyOptional({ description: 'Nome do layout' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do layout' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Conteúdo do layout em formato JSON' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsInt()
  @IsOptional()
  categoryId?: number;
}

export class LayoutResponseDto {
  @ApiProperty()
  layout_id!: number;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiProperty()
  tenant_id!: number;

  @ApiProperty()
  created_by!: number;

  @ApiProperty()
  created_at!: Date;
}
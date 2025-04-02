import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';

export class CreateLayoutDto {
  @ApiProperty({ description: 'Nome do layout' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Descrição do layout' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Conteúdo do layout (elementos, configurações, etc.)' })
  @IsObject()
  content!: any;

  @ApiPropertyOptional({ description: 'ID do usuário criador' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsInt()
  @IsOptional()
  categoryId?: number;
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

  @ApiPropertyOptional({ description: 'Conteúdo do layout (elementos, configurações, etc.)' })
  @IsObject()
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsInt()
  @IsOptional()
  categoryId?: number;
}

export class LayoutResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  content!: any;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  categoryId?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
  
  @ApiPropertyOptional()
  category?: any;
}

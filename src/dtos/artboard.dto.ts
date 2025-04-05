import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateArtboardDto {
  @ApiProperty({ description: 'ID do tipo de layout' })
  @IsInt()
  layout_type_id!: number;

  @ApiProperty({ description: 'Nome do artboard' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Largura do artboard' })
  @IsInt()
  width!: number;

  @ApiProperty({ description: 'Altura do artboard' })
  @IsInt()
  height!: number;

  @ApiProperty({ description: 'ID do tenant' })
  @IsInt()
  tenant_id!: number;

  @ApiProperty({ description: 'ID do usuário criador' })
  @IsInt()
  created_by!: number;
}

export class UpdateArtboardDto {
  @ApiPropertyOptional({ description: 'Nome do artboard' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Largura do artboard' })
  @IsInt()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: 'Altura do artboard' })
  @IsInt()
  @IsOptional()
  height?: number;
}

export class ArtboardResponseDto {
  @ApiProperty()
  artboard_id!: number;

  @ApiProperty()
  layout_type_id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty()
  tenant_id!: number;

  @ApiProperty()
  created_by!: number;

  @ApiProperty()
  created_at!: Date;
}
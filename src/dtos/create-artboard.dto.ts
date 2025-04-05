import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';

export class CreateArtboardDto {
  @ApiPropertyOptional({ description: 'Nome do artboard' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'ID do layout' })
  @IsInt()
  layout_id!: number;

  @ApiProperty({ description: 'Largura do artboard' })
  @IsNumber()
  width!: number;

  @ApiProperty({ description: 'Altura do artboard' })
  @IsNumber()
  height!: number;
}

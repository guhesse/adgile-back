import { ApiProperty } from '@nestjs/swagger';

export class CreateLayoutDto {
    @ApiProperty({ description: 'Name of the layout' })
    name: string;

    @ApiProperty({ description: 'Description of the layout' })
    description: string;

    @ApiProperty({ description: 'Layout content in JSON format' })
    content: string;

    @ApiProperty({ description: 'Category ID of the layout', required: false })
    categoryId?: number | null;
}

export class UpdateLayoutDto extends CreateLayoutDto {}

export class LayoutResponseDto {
    @ApiProperty({ description: 'Layout ID' })
    id: number;

    @ApiProperty({ description: 'Name of the layout' })
    name: string;

    @ApiProperty({ description: 'Description of the layout' })
    description: string;

    @ApiProperty({ description: 'Layout content in JSON format' })
    content: string;

    @ApiProperty({ description: 'ID of the associated artboard' })
    artboard_id: number;
}
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateLayoutDto } from './create-layout.dto';

export class UpdateLayoutDto extends PartialType(CreateLayoutDto) {
    @ApiProperty({
        description: 'The ID of the layout to update',
        example: 1
    })
    id: number;
}
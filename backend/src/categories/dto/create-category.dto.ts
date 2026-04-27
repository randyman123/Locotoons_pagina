import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Figuras Retro' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'figuras-retro' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Coleccionables retro de anime y videojuegos', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

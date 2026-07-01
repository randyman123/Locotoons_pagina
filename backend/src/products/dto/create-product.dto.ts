import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ProductSpecificationDto {
  @ApiProperty({ example: 'Material' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: 'PVC' })
  @IsNotEmpty()
  @IsString()
  value: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Figura Retro Anime' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'figura-retro-anime' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Figura de colección retro inspirada en anime clásico.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 24990 })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'https://example.com/image.png', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    type: [ProductSpecificationDto],
    example: [{ label: 'Material', value: 'PVC' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[];
}

import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Juan Perez', required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'cliente@correo.com', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: '+56 9 1234 5678', required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ example: 'Dirección de envío completa' })
  @IsNotEmpty()
  @IsString()
  shippingAddress: string;

  @ApiProperty({
    example: 'bank_transfer',
    enum: ['bank_transfer', 'whatsapp_coordination'],
    required: false,
  })
  @IsOptional()
  @IsIn(['bank_transfer', 'whatsapp_coordination'])
  paymentMethod?: 'bank_transfer' | 'whatsapp_coordination';

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

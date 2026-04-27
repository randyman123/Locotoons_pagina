import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const ORDER_STATUS_VALUES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUS_VALUES, example: 'shipped' })
  @IsIn(ORDER_STATUS_VALUES)
  status: (typeof ORDER_STATUS_VALUES)[number];
}

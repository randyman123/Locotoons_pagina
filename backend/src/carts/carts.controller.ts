import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartsService } from './carts.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    role?: string;
  };
};

@ApiTags('carts')
@Controller('carts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get(':userId')
  getCart(@Param('userId', ParseIntPipe) userId: number, @Req() req: AuthenticatedRequest) {
    this.cartsService.assertUserAccess(userId, req.user);
    return this.cartsService.findCart(userId);
  }

  @Post(':userId/items')
  addItem(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() addCartItemDto: AddCartItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.cartsService.assertUserAccess(userId, req.user);
    return this.cartsService.addItem(userId, addCartItemDto);
  }

  @Patch(':userId/items/:itemId')
  updateItemQuantity(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    this.cartsService.assertUserAccess(userId, req.user);
    return this.cartsService.updateItemQuantity(userId, itemId, updateCartItemDto.quantity);
  }

  @Delete(':userId/items/:itemId')
  removeItem(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    this.cartsService.assertUserAccess(userId, req.user);
    return this.cartsService.removeItem(userId, itemId);
  }
}

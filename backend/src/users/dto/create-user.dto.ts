import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@correo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Nombre completo' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'SuperSecreto123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

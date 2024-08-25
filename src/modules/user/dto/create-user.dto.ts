import {
  IsEmail,
  IsEnum,
  IsString,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';
import { Roles } from 'src/enum/roles.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEnum(Roles)
  role: Roles;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDate()
  @IsOptional()
  createdAt?: Date;

  @IsString()
  @IsOptional()
  salary: string;

  @IsString()
  @IsOptional()
  rm: string;
}

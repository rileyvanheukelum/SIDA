import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { Role } from '@prisma/client'

export class CreateMemberInvitationDto {
  @IsString()
  @MaxLength(120)
  name!: string

  @IsEmail()
  @MaxLength(254)
  email!: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  disciplines?: string[]
}

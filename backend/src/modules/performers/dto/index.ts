import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreatePerformerDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;
}

export class UpdatePerformerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

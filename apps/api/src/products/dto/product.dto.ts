import { ProductType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ProductDto {
  @IsString() @MinLength(1) @MaxLength(200) name!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null;
  @IsOptional() @IsString() @MaxLength(80) sku?: string | null;
  @IsEnum(ProductType) type!: ProductType;
  @IsString() @MinLength(1) @MaxLength(50) unit!: string;
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(100000000)
  defaultQuantity!: number;
  @IsInt() @Min(0) @Max(2147483647) unitPriceMinor!: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) vatRate!: number;
  @Length(3, 3) @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
}

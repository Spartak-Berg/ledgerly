import { InvoiceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class InvoiceItemDto {
  @IsOptional() @IsUUID() productId?: string | null;
  @IsString() @MinLength(1) @MaxLength(1000) description!: string;
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(100000000)
  quantity!: number;
  @IsString() @MinLength(1) @MaxLength(50) unit!: string;
  @IsInt() @Min(0) @Max(2147483647) unitPriceMinor!: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) vatRate!: number;
}

export class InvoiceDraftDto {
  @IsUUID() customerId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) issueDate!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) dueDate!: string;
  @Length(3, 3) @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsOptional() @IsString() @MaxLength(200) reference?: string | null;
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purchaseOrderReference?: string | null;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) paymentTerms?: string | null;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];
}

export class UpdateInvoiceDraftDto extends InvoiceDraftDto {
  @IsInt() @Min(1) version!: number;
}

export class ListInvoicesQueryDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsEnum(InvoiceStatus) status?: InvoiceStatus;
}

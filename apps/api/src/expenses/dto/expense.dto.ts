import { ExpenseStatus, PaymentMethod } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SupplierDto {
  @IsString() @MinLength(1) @MaxLength(200) name!: string;
  @IsOptional() @IsString() @MaxLength(50) organisationNumber?: string | null;
  @IsOptional() @IsEmail() @MaxLength(320) email?: string | null;
  @IsOptional() @IsString() @MaxLength(50) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(200) addressLine1?: string | null;
  @IsOptional() @IsString() @MaxLength(20) postalCode?: string | null;
  @IsOptional() @IsString() @MaxLength(120) city?: string | null;
  @Length(2, 2) @Matches(/^[A-Z]{2}$/) countryCode!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
}

export class ExpenseCategoryDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @Min(0) @Max(100) vatRate!: number;
}

export class ExpenseDto {
  @IsOptional() @IsUUID() supplierId?: string | null;
  @IsUUID() categoryId!: string;
  @IsString() @MinLength(1) @MaxLength(200) merchant!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string | null;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  expenseDate!: string;
  @Length(3, 3) @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsInt() @Min(0) @Max(2147483647) netMinor!: number;
  @IsInt() @Min(0) @Max(2147483647) vatMinor!: number;
  @IsInt() @Min(1) @Max(2147483647) totalMinor!: number;
  @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string | null;
}

export class ReviewExpenseDto {
  @IsEnum(ExpenseStatus) status!: ExpenseStatus;
}

export class ExpenseListQueryDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsEnum(ExpenseStatus) status?: ExpenseStatus;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() supplierId?: string;
  @IsOptional() @Length(3, 3) @Matches(/^[A-Z]{3}$/) currency?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) dateFrom?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) dateTo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minAmountMinor?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxAmountMinor?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}

export class SupplierListQueryDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional()
  @Transform(({ value }) => value !== 'false')
  active = true;
}

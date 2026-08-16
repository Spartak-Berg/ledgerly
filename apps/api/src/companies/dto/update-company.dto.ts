import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;
const trimOnly = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const upper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(trimOnly)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimmed)
  organisationNumber?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  @Transform(trimmed)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimmed)
  phone?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  @Transform(trimmed)
  website?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimmed)
  addressLine1?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimmed)
  addressLine2?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(trimmed)
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trimmed)
  city?: string | null;

  @IsOptional()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  @Transform(upper)
  countryCode?: string;

  @IsOptional()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  @Transform(upper)
  defaultCurrency?: string;

  @IsOptional()
  @IsBoolean()
  vatRegistered?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimmed)
  vatNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimmed)
  bankAccount?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(upper)
  iban?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(upper)
  bic?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  defaultPaymentDays?: number;

  @IsOptional()
  @Min(0)
  @Max(100)
  defaultVatRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  financialYearStartMonth?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  @Matches(/^[A-Z0-9-]+$/)
  @Transform(upper)
  invoicePrefix?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(10)
  invoiceNumberPadding?: number;
}

import { CustomerStatus, CustomerType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName!: string;

  @IsOptional() @IsEnum(CustomerType) type?: CustomerType;
  @IsOptional() @IsString() @MaxLength(50) organisationNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @IsOptional() @IsString() @MaxLength(200) billingAddressLine1?: string | null;
  @IsOptional() @IsString() @MaxLength(200) billingAddressLine2?: string | null;
  @IsOptional() @IsString() @MaxLength(20) billingPostalCode?: string | null;
  @IsOptional() @IsString() @MaxLength(120) billingCity?: string | null;
  @IsOptional() @IsString() @MaxLength(200) postalAddressLine1?: string | null;
  @IsOptional() @IsString() @MaxLength(200) postalAddressLine2?: string | null;
  @IsOptional() @IsString() @MaxLength(20) postalPostalCode?: string | null;
  @IsOptional() @IsString() @MaxLength(120) postalCity?: string | null;
  @IsOptional() @Length(2, 2) @Matches(/^[A-Z]{2}$/) countryCode?: string;
  @IsOptional() @IsString() @MaxLength(50) vatNumber?: string | null;
  @IsOptional() @Length(3, 3) @Matches(/^[A-Z]{3}$/) defaultCurrency?: string;
  @IsOptional() @IsInt() @Min(1) @Max(365) defaultPaymentDays?: number;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string | null;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}

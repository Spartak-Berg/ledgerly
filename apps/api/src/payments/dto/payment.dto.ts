import { PaymentMethod } from '@prisma/client';
import {
  IsEnum,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RecordPaymentDto {
  @IsInt() @Min(1) @Max(2147483647) amountMinor!: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  paymentDate!: string;
  @IsEnum(PaymentMethod) method!: PaymentMethod;
  @IsOptional() @IsString() @MaxLength(200) reference?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) note?: string | null;
}

export class ReversePaymentDto {
  @IsString() @MinLength(3) @MaxLength(1000) reason!: string;
}

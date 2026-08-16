import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class IssueInvoiceDto {
  @IsInt() @Min(1) version!: number;
}

export class VoidInvoiceDto {
  @IsString() @MinLength(3) @MaxLength(1000) reason!: string;
}

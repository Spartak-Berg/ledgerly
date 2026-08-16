import { IsUUID } from 'class-validator';

export class SelectCompanyDto {
  @IsUUID()
  companyId!: string;
}

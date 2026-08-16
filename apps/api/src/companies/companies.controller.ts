import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Req,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SkipCompanyContext } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CompaniesService } from './companies.service';
import { SelectCompanyDto } from './dto/select-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@SkipCompanyContext()
export class CompaniesController {
  constructor(
    private readonly companies: CompaniesService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.companies.list(request.auth.userId);
  }

  @Put('current')
  async select(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SelectCompanyDto,
  ) {
    await this.companies.select(request.auth.userId, dto.companyId);
    return this.auth.profile(request.auth.userId);
  }

  @Get(':id')
  get(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.companies.get(request.auth.userId, id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companies.update(request.auth.userId, id, dto);
  }
}

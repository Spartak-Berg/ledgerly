import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '../auth/auth.decorators';
import type { CompanyRequest } from '../auth/auth.types';
import { CompanyPermission } from '../auth/permissions';
import {
  InvoiceDraftDto,
  ListInvoicesQueryDto,
  UpdateInvoiceDraftDto,
} from './dto/invoice-draft.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @RequirePermission(CompanyPermission.VIEW_INVOICES)
  list(@Req() request: CompanyRequest, @Query() query: ListInvoicesQueryDto) {
    return this.invoices.list(request.auth.companyId, query);
  }

  @Get(':id')
  @RequirePermission(CompanyPermission.VIEW_INVOICES)
  get(@Req() request: CompanyRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.get(request.auth.companyId, id);
  }

  @Post()
  @RequirePermission(CompanyPermission.MANAGE_INVOICES)
  create(@Req() request: CompanyRequest, @Body() dto: InvoiceDraftDto) {
    return this.invoices.create(request.auth.companyId, dto);
  }

  @Patch(':id')
  @RequirePermission(CompanyPermission.MANAGE_INVOICES)
  update(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDraftDto,
  ) {
    return this.invoices.update(request.auth.companyId, id, dto);
  }

  @Post(':id/duplicate')
  @RequirePermission(CompanyPermission.MANAGE_INVOICES)
  duplicate(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.duplicate(request.auth.companyId, id);
  }

  @Delete(':id')
  @RequirePermission(CompanyPermission.MANAGE_INVOICES)
  archive(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.archive(request.auth.companyId, id);
  }
}

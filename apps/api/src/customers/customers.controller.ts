import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '../auth/auth.decorators';
import { CompanyPermission } from '../auth/permissions';
import type { CompanyRequest } from '../auth/auth.types';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermission(CompanyPermission.MANAGE_CUSTOMERS)
  create(@Req() request: CompanyRequest, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(request.auth.companyId, dto);
  }

  @Get()
  @RequirePermission(CompanyPermission.VIEW_CUSTOMERS)
  findAll(@Req() request: CompanyRequest) {
    return this.customersService.findAll(request.auth.companyId);
  }

  @Get(':id')
  @RequirePermission(CompanyPermission.VIEW_CUSTOMERS)
  findOne(
    @Req() request: CompanyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.customersService.findOne(request.auth.companyId, id);
  }

  @Patch(':id')
  @RequirePermission(CompanyPermission.MANAGE_CUSTOMERS)
  update(
    @Req() request: CompanyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(request.auth.companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(CompanyPermission.MANAGE_CUSTOMERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: CompanyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.customersService.remove(request.auth.companyId, id);
  }
}

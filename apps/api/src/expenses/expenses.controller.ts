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
import { CategoriesService } from './categories.service';
import {
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseListQueryDto,
  ReviewExpenseDto,
  SupplierDto,
  SupplierListQueryDto,
} from './dto/expense.dto';
import { ExpensesService } from './expenses.service';
import { SuppliersService } from './suppliers.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}
  @Get()
  @RequirePermission(CompanyPermission.VIEW_EXPENSES)
  list(@Req() request: CompanyRequest, @Query() query: ExpenseListQueryDto) {
    return this.expenses.list(request.auth.companyId, query);
  }
  @Get(':id')
  @RequirePermission(CompanyPermission.VIEW_EXPENSES)
  get(@Req() request: CompanyRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.expenses.get(request.auth.companyId, id);
  }
  @Post()
  @RequirePermission(CompanyPermission.MANAGE_EXPENSES)
  create(@Req() request: CompanyRequest, @Body() dto: ExpenseDto) {
    return this.expenses.create(
      request.auth.companyId,
      request.auth.userId,
      dto,
    );
  }
  @Patch(':id')
  @RequirePermission(CompanyPermission.MANAGE_EXPENSES)
  update(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExpenseDto,
  ) {
    return this.expenses.update(request.auth.companyId, id, dto);
  }
  @Post(':id/review')
  @RequirePermission(CompanyPermission.MANAGE_EXPENSES)
  review(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewExpenseDto,
  ) {
    return this.expenses.review(
      request.auth.companyId,
      id,
      request.auth.userId,
      dto,
    );
  }
  @Delete(':id')
  @RequirePermission(CompanyPermission.MANAGE_EXPENSES)
  archive(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expenses.archive(request.auth.companyId, id);
  }
}

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}
  @Get()
  @RequirePermission(CompanyPermission.VIEW_SUPPLIERS)
  list(@Req() request: CompanyRequest, @Query() query: SupplierListQueryDto) {
    return this.suppliers.list(request.auth.companyId, query);
  }
  @Get(':id')
  @RequirePermission(CompanyPermission.VIEW_SUPPLIERS)
  get(@Req() request: CompanyRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.suppliers.get(request.auth.companyId, id);
  }
  @Post()
  @RequirePermission(CompanyPermission.MANAGE_SUPPLIERS)
  create(@Req() request: CompanyRequest, @Body() dto: SupplierDto) {
    return this.suppliers.create(request.auth.companyId, dto);
  }
  @Patch(':id')
  @RequirePermission(CompanyPermission.MANAGE_SUPPLIERS)
  update(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SupplierDto,
  ) {
    return this.suppliers.update(request.auth.companyId, id, dto);
  }
  @Delete(':id')
  @RequirePermission(CompanyPermission.MANAGE_SUPPLIERS)
  archive(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.suppliers.archive(request.auth.companyId, id);
  }
}

@Controller('expense-categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get()
  @RequirePermission(CompanyPermission.VIEW_EXPENSES)
  list(
    @Req() request: CompanyRequest,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.categories.list(
      request.auth.companyId,
      includeInactive === 'true',
    );
  }
  @Post()
  @RequirePermission(CompanyPermission.MANAGE_EXPENSES)
  create(@Req() request: CompanyRequest, @Body() dto: ExpenseCategoryDto) {
    return this.categories.create(request.auth.companyId, dto);
  }
  @Patch(':id')
  @RequirePermission(CompanyPermission.MANAGE_EXPENSES)
  update(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExpenseCategoryDto,
  ) {
    return this.categories.update(request.auth.companyId, id, dto);
  }
  @Delete(':id')
  @RequirePermission(CompanyPermission.MANAGE_EXPENSES)
  archive(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categories.archive(request.auth.companyId, id);
  }
}

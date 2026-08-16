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
import { CompanyPermission } from '../auth/permissions';
import type { CompanyRequest } from '../auth/auth.types';
import { ProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() @RequirePermission(CompanyPermission.VIEW_PRODUCTS) list(
    @Req() request: CompanyRequest,
    @Query('search') search?: string,
    @Query('type') type?: 'PRODUCT' | 'SERVICE',
  ) {
    return this.products.list(request.auth.companyId, search, type);
  }
  @Get(':id') @RequirePermission(CompanyPermission.VIEW_PRODUCTS) get(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.products.get(request.auth.companyId, id);
  }
  @Post() @RequirePermission(CompanyPermission.MANAGE_PRODUCTS) create(
    @Req() request: CompanyRequest,
    @Body() dto: ProductDto,
  ) {
    return this.products.create(request.auth.companyId, dto);
  }
  @Patch(':id') @RequirePermission(CompanyPermission.MANAGE_PRODUCTS) update(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProductDto,
  ) {
    return this.products.update(request.auth.companyId, id, dto);
  }
  @Post(':id/duplicate')
  @RequirePermission(CompanyPermission.MANAGE_PRODUCTS)
  duplicate(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.products.duplicate(request.auth.companyId, id);
  }
  @Delete(':id') @RequirePermission(CompanyPermission.MANAGE_PRODUCTS) archive(
    @Req() request: CompanyRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.products.archive(request.auth.companyId, id);
  }
}

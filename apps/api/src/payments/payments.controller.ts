import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '../auth/auth.decorators';
import type { CompanyRequest } from '../auth/auth.types';
import { CompanyPermission } from '../auth/permissions';
import { RecordPaymentDto, ReversePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller('invoices/:invoiceId/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @RequirePermission(CompanyPermission.VIEW_PAYMENTS)
  list(
    @Req() request: CompanyRequest,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.payments.list(request.auth.companyId, invoiceId);
  }

  @Post()
  @RequirePermission(CompanyPermission.MANAGE_PAYMENTS)
  record(
    @Req() request: CompanyRequest,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.payments.record(
      request.auth.companyId,
      invoiceId,
      request.auth.userId,
      dto,
    );
  }

  @Post(':paymentId/reverse')
  @RequirePermission(CompanyPermission.MANAGE_PAYMENTS)
  reverse(
    @Req() request: CompanyRequest,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: ReversePaymentDto,
  ) {
    return this.payments.reverse(
      request.auth.companyId,
      invoiceId,
      paymentId,
      request.auth.userId,
      dto,
    );
  }
}

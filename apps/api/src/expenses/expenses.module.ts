import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  CategoriesController,
  ExpensesController,
  SuppliersController,
} from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { SuppliersService } from './suppliers.service';

@Module({
  controllers: [ExpensesController, SuppliersController, CategoriesController],
  providers: [ExpensesService, SuppliersService, CategoriesService],
})
export class ExpensesModule {}

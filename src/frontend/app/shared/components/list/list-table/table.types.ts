import { DataFunction, DataFunctionDefinition } from '../data-sources-controllers/list-data-source';
import { TableCellStatusDirective } from './table-cell-status.directive';
import { listTableCells, TableCellComponent } from './table-cell/table-cell.component';
import { TableRowComponent } from './table-row/table-row.component';
import { TableComponent } from './table.component';

export interface ITableColumn<T> {
  columnId: string;
  cell?: (row: T) => string; // Either cell OR cellComponent should be defined
  cellComponent?: any;
  cellConfig?: any;   // Config for a custom cell component
  headerCell?: () => string; // Either headerCell OR headerCellComponent should be defined
  headerCellComponent?: any;
  class?: string;
  sort?: boolean | DataFunctionDefinition | DataFunction<T>;
  cellFlex?: string;
}

export interface ITableText {
  title: string;
  filter?: string;
}

export const listTableComponents = [
  TableComponent,
  TableCellComponent,
  TableRowComponent,
  ...listTableCells,
  TableCellStatusDirective
];

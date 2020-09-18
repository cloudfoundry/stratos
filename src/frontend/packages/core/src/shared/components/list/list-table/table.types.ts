import { Observable } from 'rxjs';

import { DataFunction, DataFunctionDefinition } from '../data-sources-controllers/list-data-source';
import { TableCellStatusDirective } from './table-cell-status.directive';
import { listTableCells, TableCellComponent } from './table-cell/table-cell.component';
import { TableRowComponent } from './table-row/table-row.component';
import { TableComponent } from './table.component';

export interface ICellAsyncValue {
  pathToObs: string;
  pathToValue: string;
}

export interface ICellAsyncLink {
  pathToValue: string;
}

export interface ICellDefinition<T> {
  // Dot separated path to get the value from the row
  valuePath?: string;
  // Takes president over valuePath
  getValue?: (row: T, schemaKey?: string) => string | Observable<string>;
  // Should the value of getLink be used in a href or routerLink
  externalLink?: boolean;
  // Automatically turns the cell into a link
  getLink?: (row: T, schemaKey?: string) => string;
  // Used in conjunction with asyncValue
  getAsyncLink?: (value, schemaKey?: string) => string;
  newTab?: boolean;
  asyncValue?: ICellAsyncValue;
  showShortLink?: boolean;
}

export type CellConfigFunction<T> = (row: T) => any;
export interface ITableColumn<T> {
  columnId: string;
  cellComponent?: any;
  cellDefinition?: ICellDefinition<T>; // This takes president over cellComponent
  cellConfig?: object | CellConfigFunction<T>;   // Config for a custom cell component
  headerCell?: () => string; // Either headerCell OR headerCellComponent should be defined
  headerCellComponent?: any;
  /**
   * Has to be a known class in table.component.scss
   */
  class?: string;
  /**
   * Has to be a known class in table.component.scss
   */
  headerClass?: string;
  /**
   * Has to be a known class in table.component.scss
   */
  cellClass?: string;
  sort?: boolean | DataFunctionDefinition | DataFunction<T>;
  cellFlex?: string;
  cellAlignSelf?: string;
}

export interface ITableTextMaxed {
  icon: string;
  iconFont?: string;
  canIgnoreMaxFirstLine: string;
  cannotIgnoreMaxFirstLine: string;
  filterLine?: string;
}

export interface ITableText {
  title?: string;
  filter?: string;
  noEntries?: string;
  maxedResults?: ITableTextMaxed;
}

export const listTableComponents = [
  TableComponent,
  TableCellComponent,
  TableRowComponent,
  ...listTableCells,
  TableCellStatusDirective,
];

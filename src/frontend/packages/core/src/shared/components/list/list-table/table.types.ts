import { Observable } from 'rxjs';

import { DataFunction, DataFunctionDefinition } from '../data-sources-controllers/list-data-source';
import { TableCellStatusDirective } from './table-cell-status.directive';
import { listTableCells, TableCellComponent } from './table-cell/table-cell.component';
import { TableRowComponent } from './table-row/table-row.component';

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
  getAsyncLink?: (value: any, schemaKey?: string) => string;
  newTab?: boolean;
  asyncValue?: ICellAsyncValue;
  showShortLink?: boolean;
}

export type CellConfigFunction<T> = (row: T) => any;
export interface ITableColumn<T> {
  columnId: string;
  cellComponent?: any;
  cellDefinition?: ICellDefinition<T>; // This takes president over cellComponent
  /**
   * Configuration object or function for custom cell components.
   *
   * This property provides configuration to a custom cell component specified in `cellComponent`.
   * It can be provided in two ways:
   *
   * @example
   * // Static object configuration - most common pattern
   * {
   *   cellComponent: MyCustomCellComponent,
   *   cellConfig: {
   *     someOption: 'value',
   *     anotherOption: 42
   *   }
   * }
   *
   * @example
   * // Dynamic function configuration - when config depends on row data
   * {
   *   cellComponent: MyDynamicCellComponent,
   *   cellConfig: (row: MyRowType) => ({
   *     icon: row.status === 'active' ? 'check' : 'close',
   *     color: row.priority * 100
   *   })
   * }
   *
   * @remarks
   * IMPORTANT PITFALLS TO AVOID:
   *
   * 1. **Don't pass the entire ITableColumn to the cell component**
   *    - Only pass the specific config object/function result to the cell's `@Input() config`
   *    - The cell component does NOT receive the full ITableColumn definition
   *
   * 2. **Type safety matters**
   *    - If using a function, ensure it returns the exact type expected by your cell component
   *    - The cell component's `@Input() config` will receive what this function returns
   *    - Example: `cellConfig: (row) => ({ createFavorite: ... })` returns the exact config type
   *
   * 3. **Function vs Static - choose based on needs**
   *    - Use static object when all rows need the same configuration
   *    - Use function when configuration varies per-row (icons, colors, callbacks based on data)
   *    - Function is evaluated once per row during render
   *
   * 4. **Custom cell component requirements**
   *    - Must declare `@Input() config: YourConfigType;` to receive the cellConfig value
   *    - Must declare `@Input() row: T;` to receive the current row data
   *    - See {@link TableCellFavoriteComponent} for a complete example
   *
   * @type {object | CellConfigFunction<T>}
   * - `object`: Static configuration passed as-is to the cell component
   * - `CellConfigFunction<T>`: Function receiving row data, returns dynamic configuration
   */
  cellConfig?: object | CellConfigFunction<T>;
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
  // TableComponent, // Now standalone - should not be in declarations array
  TableCellComponent,
  TableRowComponent,
  ...listTableCells,
  TableCellStatusDirective,
];

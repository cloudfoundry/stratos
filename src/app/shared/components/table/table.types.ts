export interface ITableColumn<T> {
  columnId: string;
  cell?: (row: T) => string; // Either cell OR cellComponent should be defined
  cellComponent?: any;
  cellConfig?: any;   // Config for a custom cell component
  headerCell?: () => string; // Either headerCell OR headerCellComponent should be defined
  headerCellComponent?: any;
  class?: string;
  sort?: boolean;
  cellFlex?: string;
}

export interface ITableText {
  title: string;
  filter?: string;
}

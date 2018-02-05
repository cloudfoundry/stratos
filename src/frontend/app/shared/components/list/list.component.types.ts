import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { IListDataSource } from './data-sources-controllers/list-data-source-types';
import { ITableColumn, ITableText } from './list-table/table.types';
import { Type } from '@angular/core';

export enum ListViewTypes {
  CARD_ONLY = 'cardOnly',
  TABLE_ONLY = 'tableOnly',
  BOTH = 'both'
}

export interface IListConfig<T> {
  getGlobalActions: () => IGlobalListAction<T>[];
  getMultiActions: () => IMultiListAction<T>[];
  getSingleActions: () => IListAction<T>[];
  getColumns: () => ITableColumn<T>[];
  getDataSource: () => IListDataSource<T>;
  getMultiFiltersConfigs: () => IListMultiFilterConfig[];
  isLocal?: boolean;
  pageSizeOptions: Number[];
  viewType: ListViewTypes;
  text?: ITableText;
  enableTextFilter?: boolean;
  tableFixedRowHeight?: boolean;
  cardComponent?: any;
}

export interface IListMultiFilterConfig {
  key: string;
  label: string;
  list$: Observable<IListMultiFilterConfigItem[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<any>;
}

export interface IListMultiFilterConfigItem {
  label: string;
  item: any;
  value: string;
}

export class ListConfig implements IListConfig<any> {
  isLocal = false;
  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.BOTH;
  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => null;
  getDataSource = () => null;
  getMultiFiltersConfigs = () => [];
}

export interface IBaseListAction<T> {
  icon: string;
  label: string;
  description: string;
  visible: (row: T) => boolean;
  enabled: (row: T) => boolean;
}

export interface IListAction<T> extends IBaseListAction<T> {
  action: (item: T) => void;
}

export interface IMultiListAction<T> extends IBaseListAction<T> {
  action: (items: T[]) => void;
}

export interface IGlobalListAction<T> extends IBaseListAction<T> {
  action: () => void;
}

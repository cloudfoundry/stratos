import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { IListDataSource } from './data-sources-controllers/list-data-source-types';
import { ITableColumn, ITableText } from './list-table/table.types';
import { Type } from '@angular/core';
import { ListView } from '../../../store/actions/list.actions';

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
  viewType: ListViewTypes; // What different views the user can select (table/cards)
  defaultView?: ListView; // What is the initial view that the list will be displayed as (table/cards)
  text?: ITableText; // Override the default list text
  enableTextFilter?: boolean; // Enable a few text filter... other config required
  tableFixedRowHeight?: boolean; // Fix the height of a table row
  cardComponent?: any; // The card component used in card view
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

export class ListConfig<T> implements IListConfig<T> {
  isLocal = false;
  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.BOTH;
  text = null;
  enableTextFilter = false;
  tableFixedRowHeight = false;
  cardComponent = null;
  defaultView = 'table' as ListView;
  getGlobalActions = (): IGlobalListAction<T>[] => null;
  getMultiActions = (): IMultiListAction<T>[] => null;
  getSingleActions = (): IListAction<T>[] => null;
  getColumns = (): ITableColumn<T>[] => null;
  getDataSource = () => null;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
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

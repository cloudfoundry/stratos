import { of } from 'rxjs';

import { type IListDataSource, type CardTypes, type ITableColumn, type IGlobalListAction, type IListAction, type IListConfig, type IListMultiFilterConfig, type IMultiListAction, ListViewTypes } from '@stratosui/core';
import type { ListView } from '@stratosui/store';


export class BaseCfListConfig<T> implements IListConfig<T> {
  getDataSource!: () => IListDataSource<T>;
  isLocal = true;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  cardComponent!: CardTypes<T> | any;
  enableTextFilter = false;
  showCustomTime = false;
  getColumns = (): ITableColumn<T>[] => [];
  getGlobalActions = (): IGlobalListAction<T>[] => [];
  getMultiActions = (): IMultiListAction<T>[] => [];
  getSingleActions = (): IListAction<T>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getInitialised = (): import('rxjs').Observable<boolean> => of(true);
}

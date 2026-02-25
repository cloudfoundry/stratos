import { of } from 'rxjs';

import { IListDataSource, CardTypes, ITableColumn, IGlobalListAction, IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction, ListViewTypes } from '@stratosui/core';
import { ListView } from '@stratosui/store';


export class BaseCfListConfig<T> implements IListConfig<T> {
  getDataSource!: () => IListDataSource<T>;
  isLocal = true;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  cardComponent!: CardTypes<T>;
  enableTextFilter = false;
  showCustomTime = false;
  getColumns = (): ITableColumn<T>[] => [];
  getGlobalActions = (): IGlobalListAction<T>[] => [];
  getMultiActions = (): IMultiListAction<T>[] => [];
  getSingleActions = (): IListAction<T>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getInitialised = (): import('rxjs').Observable<boolean> => of(true);
}

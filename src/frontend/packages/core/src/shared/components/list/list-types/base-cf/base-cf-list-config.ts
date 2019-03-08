import { Type } from '@angular/core';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { CardMultiActionComponents } from '../../list-cards/card.component.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { CardCell } from '../../list.types';


export class BaseCfListConfig<T> implements IListConfig<T> {
  getDataSource: () => IListDataSource<T>;
  isLocal = true;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  cardComponent: Type<CardCell<any>> | CardMultiActionComponents;
  enableTextFilter = false;
  showMetricsRange = false;
  getColumns = () => [];
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
}

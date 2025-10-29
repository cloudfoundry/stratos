import { of } from 'rxjs';

import { IListDataSource } from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { CardTypes } from '../../../../../../../core/src/shared/components/list/list-cards/card/card.component';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { IGlobalListAction, IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';


export class BaseCfListConfig<T> implements IListConfig<T> {
  getDataSource: () => IListDataSource<T>;
  isLocal = true;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  cardComponent: CardTypes<T>;
  enableTextFilter = false;
  showCustomTime = false;
  getColumns = (): ITableColumn<T>[] => [];
  getGlobalActions = (): IGlobalListAction<T>[] => [];
  getMultiActions = (): IMultiListAction<T>[] => [];
  getSingleActions = (): IListAction<T>[] => [];
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getInitialised = (): import('rxjs').Observable<boolean> => of(true);
}

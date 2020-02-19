import { of } from 'rxjs';

import { IListDataSource } from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { CardTypes } from '../../../../../../../core/src/shared/components/list/list-cards/card/card.component';
import { IListConfig, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';


export class BaseCfListConfig<T> implements IListConfig<T> {
  getDataSource: () => IListDataSource<T>;
  isLocal = true;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  cardComponent: CardTypes<T>;
  enableTextFilter = false;
  showCustomTime = false;
  getColumns = () => [];
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
  getInitialised = () => of(true);
}

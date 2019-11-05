import { of } from 'rxjs';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { CardTypes } from '../../list-cards/card/card.component';
import { IListConfig, ListViewTypes } from '../../list.component.types';


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

import { ListView } from '../../../../../store/actions/list.actions';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { ITableText } from '../../list-table/table.types';
import {
  IGlobalListAction,
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  IMultiListAction,
  ListViewTypes,
  ListConfig,
} from '../../list.component.types';


export class BaseCfListConfig<T> extends ListConfig<T> implements IListConfig<T> {
  getDataSource: () => IListDataSource<T>;
  isLocal = true;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  getColumns = () => [];
  getGlobalActions = () => [];
  getMultiActions = () => [];
  getSingleActions = () => [];
  getMultiFiltersConfigs = () => [];
}

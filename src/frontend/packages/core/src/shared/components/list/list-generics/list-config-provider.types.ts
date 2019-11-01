import { IListDataSourceConfig } from '../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../list.component.types';

export type ListConfigUpdate<T> = Partial<Omit<IListConfig<T>, 'getDataSource'>>;
export type ListDataSourceConfigUpdate<A, T> = Partial<IListDataSourceConfig<A, T>>;

export interface ListConfigProvider<T = any, A = T> {
  getListConfig: () => IListConfig<T>;
  updateListConfig: (updates: ListConfigUpdate<T>) => void;
  updateDataSourceConfig: (updates: ListDataSourceConfigUpdate<A, T>) => void;
}

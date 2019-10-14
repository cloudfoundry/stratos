import { Store } from '@ngrx/store';

import { IListDataSourceConfig } from '../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../list.component.types';
import { CatalogueEntityDrivenListConfig } from '../simple-list/entity-catalogue-list-config';
import {
  createListActionFromActionOrConfig,
  ListDefaultsActionOrConfig,
  ListDefaultsDataSource as ListDefaultsDataSource,
} from './defaults-datasource';

function createListConfig<A, T>(
  actionOrConfig?: ListDefaultsActionOrConfig,
  listConfig?: Partial<IListConfig<T>>
) {
  if (actionOrConfig) {
    const { catalogueEntity } = createListActionFromActionOrConfig(actionOrConfig);
    return {
      ...new CatalogueEntityDrivenListConfig<T>(catalogueEntity),
      ...listConfig
    };
  } else if (listConfig) {
    // Going on the assumption that the list is not a partial if used in this way
    return listConfig as IListConfig<T>;
  } else {
    throw Error(`Either \`actionOrConfig\` or \`listConfig\` must be supplied when creating a defaults list`);
  }
}

function createDataSource<A, T>(
  store: Store<any>,
  listConfig: IListConfig<T>,
  actionOrConfig?: ListDefaultsActionOrConfig,
  dataSourceConfig?: Partial<IListDataSourceConfig<A, T>>,
) {
  const existingDs = listConfig.getDataSource ? listConfig.getDataSource() : null;
  return existingDs || new ListDefaultsDataSource<A, T>(
    actionOrConfig,
    listConfig,
    store,
    dataSourceConfig
  );
}


export function createListDefaultConfig<A, T>(
  store: Store<any>,
  actionOrConfig?: ListDefaultsActionOrConfig,
  listConfig?: Partial<IListConfig<T>>,
  dataSourceConfig?: Partial<IListDataSourceConfig<A, T>>,
): IListConfig<T> {

  const newListConfig = createListConfig<A, T>(
    actionOrConfig,
    listConfig,
  );

  const ds = createDataSource(
    store,
    newListConfig,
    actionOrConfig,
    dataSourceConfig
  );
  newListConfig.getDataSource = () => ds;

  return newListConfig;
}

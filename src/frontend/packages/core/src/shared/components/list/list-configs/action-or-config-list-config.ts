import { Store } from '@ngrx/store';

import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { ListDataSource } from '../data-sources-controllers/list-data-source';
import { IListDataSourceConfig } from '../data-sources-controllers/list-data-source-config';
import {
  createListActionFromActionOrConfig,
  ListDefaultsActionOrConfig,
  ListDefaultsConfig,
  ListDefaultsDataSource,
} from '../defaults-list/defaults-datasource';
import { IListConfig } from '../list.component.types';
import { CatalogueEntityDrivenListConfig } from '../simple-list/entity-catalogue-list-config';







export interface ListConfigOverrides<A, T> {
  listConfigOverrides?: Partial<IListConfig<T>>;
  dataSourceOverrides?: Partial<IListDataSourceConfig<A, T>>;
}



export class ListConfigGenerator {

  static createFromAction<T, A = T>(
    store: Store<any>,
    paginatedAction: PaginatedAction,
    overrides?: ListConfigOverrides<A, T>
  ): IListConfig<T> {
    return ListConfigGenerator.createFromActionOrConfig(store, paginatedAction, overrides);
  }

  static createFromEntityConfig<T, A = T>(
    store: Store<any>,
    config: ListDefaultsConfig,
    overrides?: ListConfigOverrides<A, T>
  ): IListConfig<T> {
    return ListConfigGenerator.createFromActionOrConfig(store, config, overrides);
  }

  static createFromActionOrConfig<T, A = T>(
    store: Store<any>,
    actionOrConfig: ListDefaultsActionOrConfig,
    overrides?: ListConfigOverrides<A, T>
  ): IListConfig<T> {
    const { catalogueEntity } = createListActionFromActionOrConfig(actionOrConfig);
    const ls = {
      ...new CatalogueEntityDrivenListConfig<T>(catalogueEntity),
      ...(overrides ? overrides.listConfigOverrides : {})
    };
    const dsConfig = {
      ...ListDataSourceConfigGenerator.createFromActionOrConfig<A, T>(store, actionOrConfig, ls),
      ...(overrides ? overrides.dataSourceOverrides : {})
    };
    const ds = ListDataSourceGenerator.createFromActionOrConfig<A, T>(
      store,
      actionOrConfig,
      ls,
      dsConfig
    );
    ls.getDataSource = () => ds;
    return ls;
  }
}

export class ListDataSourceConfigGenerator {
  static createFromActionOrConfig<A, T>(
    store: Store<any>,
    actionOrConfig: ListDefaultsActionOrConfig,
    listConfig: IListConfig<T>,
    dsOverrides?: Partial<IListDataSourceConfig<A, T>>
  ): IListDataSourceConfig<A, T> {
    const { action, catalogueEntity } = createListActionFromActionOrConfig(actionOrConfig);
    return {
      store,
      action,
      paginationKey: action.paginationKey,
      schema: catalogueEntity.getSchema(action.schemaKey),
      getRowUniqueId: entity => catalogueEntity.getGuidFromEntity(entity),
      listConfig,
      isLocal: true, // assume true unless overwritten
      ...dsOverrides
    };
  }
}

export class ListDataSourceGenerator {
  static createFromActionOrConfig<A, T>(
    store: Store<any>,
    actionOrConfig: ListDefaultsActionOrConfig,
    listConfig: IListConfig<T>,
    dsOverrides?: Partial<IListDataSourceConfig<A, T>>
  ): ListDataSource<T, A> {
    return new ListDefaultsDataSource<A, T>(
      actionOrConfig,
      listConfig,
      store,
      dsOverrides
    );

  }
}


    // return this.listConfig = ListConfigGenerator.createFromActionOrConfig(
    //   this.store,
    //   this.actionOrConfig,
    //   {
    //     listConfigOverrides: this.overrideListConfig,
    //     dataSourceOverrides: this.overrideDataSourceConfig
    //   }
    // );

// export class ListConfigGenerator {
//   static createFromActionOrConfig<A, T>(
//     actionOrConfig: ListDefaultsActionOrConfig,
//   ): IListConfig<T> {
//     const { catalogueEntity } = createListActionFromActionOrConfig(actionOrConfig);
//     return new CatalogueEntityDrivenListConfig<T>(catalogueEntity);
//   }
// }

// export class ListConfigFromAction<T> implements IListConfig<T> {
//   constructor(a: IListConfig<T>) {
//     // const a = {} as IListConfig<T>;
//     Object.entries(a).forEach(([key, value]) => {
//       this[key] = value;
//     });
//   }
// }

// this.listConfig

// this.dataSourceConfig = {
//   ...this.dataSourceConfig,
//   ...pDataSourceConfig
// };

// // this.dataSource = {
// //   ...ListDataSourceConfigGenerator.createFromActionOrConfig<A, T>(store, actionOrConfig, ls)
// //   ...this.dataSourceConfig,
// //   ...pDataSourceConfig
// // }

// const newDsConfig = {

// };


    // pListConfig: Partial<IListConfig<T>> = {},
    // pDataSourceConfig: Partial<IListDataSourceConfig<A, T>> = {}

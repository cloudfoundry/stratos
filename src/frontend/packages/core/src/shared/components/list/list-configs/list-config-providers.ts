import { Store } from '@ngrx/store';

import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { IListDataSourceConfig } from '../data-sources-controllers/list-data-source-config';
import {
  createListActionFromActionOrConfig,
  ListDefaultsActionOrConfig,
  ListDefaultsConfig,
} from '../defaults-list/defaults-datasource';
import { IListConfig } from '../list.component.types';
import { CatalogueEntityDrivenListConfig } from '../simple-list/entity-catalogue-list-config';
import { ListDataSourceConfigGenerator, ListDataSourceGenerator } from './action-or-config-list-config';

export interface ListConfigProvider<T, A = T> {
  getListConfig: () => IListConfig<T>;
  updateListConfig: (updates: Partial<IListConfig<T>>) => void;
  updateDataSourceConfig: (updates: Partial<IListDataSourceConfig<A, T>>) => void;
}

export class BasicListConfigProvider<T, A = T> implements ListConfigProvider<T, A> {
  private listConfig: IListConfig<T>;
  private overrideListConfig: Partial<IListConfig<T>>;
  private overrideDataSourceConfig: Partial<IListDataSourceConfig<A, T>>;

  constructor(private store: Store<any>, private actionOrConfig: ListDefaultsActionOrConfig) { }

  public getListConfig(): IListConfig<T> {
    return this.listConfig || this.newListConfig();
  }

  public updateListConfig(updates: Partial<IListConfig<T>>) {
    this.overrideListConfig = {
      ...this.overrideListConfig,
      ...updates
    };
  }

  public updateDataSourceConfig(updates: Partial<IListDataSourceConfig<A, T>>) {
    this.overrideDataSourceConfig = {
      ...this.overrideDataSourceConfig,
      ...updates
    };
  }

  private newListConfig(): IListConfig<T> {
    if (this.listConfig) {
      const oldDs = this.listConfig.getDataSource();
      if (oldDs) {
        oldDs.destroy();
      }
    }

    const { catalogueEntity } = createListActionFromActionOrConfig(this.actionOrConfig);
    this.listConfig = {
      ...new CatalogueEntityDrivenListConfig<T>(catalogueEntity),
      ...(this.overrideListConfig || {})
    };
    const dsConfig = {
      ...ListDataSourceConfigGenerator.createFromActionOrConfig<A, T>(this.store, this.actionOrConfig, this.listConfig),
      ...(this.overrideDataSourceConfig || {})
    };
    const ds = ListDataSourceGenerator.createFromActionOrConfig<A, T>(
      this.store,
      this.actionOrConfig,
      this.listConfig,
      dsConfig
    );
    this.listConfig.getDataSource = () => ds;

    return this.listConfig;
  }
}

export class ActionListConfigProvider<T, A = T> extends BasicListConfigProvider<T, A> {
  constructor(
    store: Store<any>,
    paginatedAction: PaginatedAction
  ) {
    super(
      store,
      paginatedAction
    );
  }
}

export class EntityConfigListConfigProvider<T, A = T> extends BasicListConfigProvider<T, A> {
  constructor(
    store: Store<any>,
    config: ListDefaultsConfig
  ) {
    super(
      store,
      config
    );
  }
}

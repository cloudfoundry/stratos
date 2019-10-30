import { Store } from '@ngrx/store';

import { IListDataSourceConfig } from '../../data-sources-controllers/list-data-source-config';
import { IListConfig } from '../../list.component.types';
import { CatalogueEntityDrivenListConfig } from '../../simple-list/entity-catalogue-list-config';
import { ListActionOrConfig, ListActionOrConfigHelpers } from '../helpers/action-or-config-helpers';
import { ListConfigProvider, ListConfigUpdate, ListDataSourceConfigUpdate } from './list-config-provider.types';


export class ActionOrConfigListConfigProvider<T, A = T> implements ListConfigProvider<T, A> {
  private listConfig: IListConfig<T>;
  private overrideListConfig: Partial<IListConfig<T>>;
  private overrideDataSourceConfig: Partial<IListDataSourceConfig<A, T>>;

  constructor(private store: Store<any>, private actionOrConfig: ListActionOrConfig) { }

  public getListConfig(): IListConfig<T> {
    return this.listConfig || this.newListConfig();
  }

  public updateListConfig(updates: ListConfigUpdate<T>) {
    this.overrideListConfig = {
      ...this.overrideListConfig,
      ...updates
    };
  }

  public updateDataSourceConfig(updates: ListDataSourceConfigUpdate<A, T>) {
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

    const { catalogueEntity } = ListActionOrConfigHelpers.createListAction(this.actionOrConfig);
    this.listConfig = {
      ...new CatalogueEntityDrivenListConfig<T>(catalogueEntity),
      ...(this.overrideListConfig || {})
    };
    const dsConfig = {
      ...ListActionOrConfigHelpers.createDataSourceConfig<A, T>(this.store, this.actionOrConfig, this.listConfig),
      ...(this.overrideDataSourceConfig || {}) // TODO: RC pass in
    };
    const ds = ListActionOrConfigHelpers.createDataSource<A, T>(
      this.store,
      this.actionOrConfig,
      this.listConfig,
      dsConfig
    );
    this.listConfig.getDataSource = () => ds;

    return this.listConfig;
  }

}



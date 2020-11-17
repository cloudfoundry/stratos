import { Injectable } from '@angular/core';

import { IListConfig } from '../../../core/src/shared/components/list/list.component.types';

interface KubernetesListConfig {
  [name: string]: IListConfig<any>;
}

// Holder for list configurations
// This allows us to reference them by name and lazy-load the configs yet reference them
// in an entity defintion that may not have been laz-loaded

@Injectable({
  providedIn: 'root',
})
export class KubernetesListConfigService {

  private configs: KubernetesListConfig = {};

  set(name: string, config: IListConfig<any>) {
    this.configs[name] = config;
  }

  get<T= any>(name: string): IListConfig<T> {
    return this.configs[name];
  }
}

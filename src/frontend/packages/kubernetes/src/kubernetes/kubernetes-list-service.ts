import { Injectable } from '@angular/core';
import { ISimpleListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';

interface KubernetesListConfig {
  [name: string]: ISimpleListConfig<any>;
}

// Holder for list configurations
// This allows us to reference them by name and lazy-load the configs yet reference them
// in an entity defintion that may not have been laz-loaded

@Injectable({
  providedIn: 'root',
})
export class KubernetesListConfigService {

  private configs: KubernetesListConfig = {};

  set(name: string, config: ISimpleListConfig<any>) {
    this.configs[name] = config;
  }

  get<T= any>(name: string): ISimpleListConfig<T> {
    return name ? this.configs[name] : undefined;
  }
}

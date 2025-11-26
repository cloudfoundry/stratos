import { Injectable } from '@angular/core';
import type { ISimpleListConfig } from '@stratosui/core';

interface KubernetesListConfig {
  [name: string]: ISimpleListConfig<unknown>;
}

// Holder for list configurations
// This allows us to reference them by name and lazy-load the configs yet reference them
// in an entity defintion that may not have been laz-loaded

@Injectable({
  providedIn: 'root',
})
export class KubernetesListConfigService {

  private configs: KubernetesListConfig = {};

  set(name: string, config: ISimpleListConfig<unknown>) {
    this.configs[name] = config;
  }

  get<T = unknown>(name: string): ISimpleListConfig<T> | undefined {
    return name ? this.configs[name] as ISimpleListConfig<T> : undefined;
  }
}

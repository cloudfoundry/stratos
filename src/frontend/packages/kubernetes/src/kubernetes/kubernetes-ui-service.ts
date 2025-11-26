import { Injectable, type Type } from '@angular/core';

import type { ISimpleListConfig, PreviewableComponent } from '@stratosui/core';

class ConfigHolder<T = unknown> {

  private configs: T = {} as T;

  set(name: string, config: T): void {
    (this.configs as Record<string, T>)[name] = config;
  }

  get<Y = unknown>(name: string): Y {
    return name ? (this.configs as Record<string, Y>)[name] : undefined;
  }
}

// Holder for UI configurations - e.g. list configurations
// This allows us to reference them by name and lazy-load the configs yet reference them
// in an entity defintion that may not have been lazy-loaded

@Injectable({
  providedIn: 'root',
})
export class KubernetesUIConfigService {

  // List configurations
  public listConfig = new ConfigHolder<ISimpleListConfig<unknown>>();

  // Side Panel Preview Resource components
  public previewComponent = new ConfigHolder<Type<PreviewableComponent>>();

}

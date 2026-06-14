import { Injectable, Type } from '@angular/core';
import { ISimpleListConfig } from '@stratosui/core';

import { PreviewableComponent } from '../../../core/src/shared/previewable-component';

class ConfigHolder<T = any> {

  private configs: T = {} as T;

  set(name: string, config: T): void {
    (this.configs as any)[name] = config;
  }

  get<Y = any>(name: string): Y | undefined {
    return name ? (this.configs as any)[name] : undefined;
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
  public listConfig = new ConfigHolder<ISimpleListConfig<any>>();

  // Side Panel Preview Resource components
  public previewComponent = new ConfigHolder<Type<PreviewableComponent>>();

}

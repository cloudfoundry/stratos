import { Injectable, Type } from '@angular/core';
import { ISimpleListConfig } from 'frontend/packages/core/src/shared/components/list/list.component.types';

import { PreviewableComponent } from '../../../core/src/shared/previewable-component';

// TODO: RC remove?
interface KubernetesListConfig {
  [name: string]: ISimpleListConfig<any>;
}

class ConfigHolder<T = any> {

  private configs: T = {} as T;

  set(name: string, config: T) {
    this.configs[name] = config;
  }

  get<Y = any>(name: string): Y {
    return name ? this.configs[name] : undefined;
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

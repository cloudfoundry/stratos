import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';

import { AdaptedSignalListConfig, adaptLegacyListConfig } from '@stratosui/core';
import type { EndpointModel } from '@stratosui/store';

import type {
  BaseEndpointsDataSource,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/base-endpoints-data-source';
import {
  buildKubernetesEndpointsListConfig,
} from './kubernetes-endpoints-legacy-config.factory';

// Signal-native list config for the K8s endpoints list page.
//
// Wave-3 (K-endpoints) goal is to remove `@ngrx/store` from this slice's
// SERVICE surface. The legacy `KubernetesEndpointsListConfigService` (which
// imported `Store` directly and implemented `IListConfig<EndpointModel>`) is
// replaced by this signal-native facade. The legacy data source still
// dispatches ngrx actions because the existing `EndpointCardComponent` reads
// from `BaseEndpointsDataSource`; rewriting that card is out of scope. We
// confine the residual ngrx coupling to a small factory file that the
// signal-config wraps via `adaptLegacyListConfig`.
//
// Consumers bind `this.config` to `<app-signal-list>` and project an
// `<app-endpoint-card>` via the `cardTemplate` slot — no `<app-list>`,
// no `ListConfig` provider, no Store reference at the page level.

@Injectable({ providedIn: 'root' })
export class KubernetesEndpointsSignalConfigService {
  private readonly injector = inject(Injector);

  // Built lazily on first read so unit tests that don't render the page
  // can construct the service without spinning up the legacy data source.
  private _config?: AdaptedSignalListConfig<EndpointModel>;
  // Cached so the EndpointCardComponent binding gets a stable reference
  // across change-detection cycles. The adapter doesn't expose the raw
  // data source on its surface, so we keep our own handle here.
  private _dataSource?: BaseEndpointsDataSource;

  get config(): AdaptedSignalListConfig<EndpointModel> {
    if (!this._config) {
      this._config = runInInjectionContext(this.injector, () => {
        // The legacy IListConfig is built inside the injection context so
        // its inline `inject(...)` calls (Store, factories) resolve. The
        // adapter then converts it to a SignalListConfig with `card` as
        // the default view — the legacy page was CARD_ONLY.
        const legacy = buildKubernetesEndpointsListConfig(this.injector);
        this._dataSource = legacy.getDataSource() as BaseEndpointsDataSource;
        return adaptLegacyListConfig(legacy, {
          injector: this.injector,
          defaultViewMode: 'card',
        });
      });
    }
    return this._config;
  }

  // Underlying legacy data source. Exposed so the page-level
  // `<app-endpoint-card>` binding can pass it through — the card uses
  // `dataSource` to read the endpoint type and to gate the kebab menu.
  // Reading `config` first is required to materialise the data source.
  get dataSource(): BaseEndpointsDataSource | undefined {
    return this._dataSource;
  }

  // Releases the underlying legacy data source's pagination subscription.
  // Called from the host component's `ngOnDestroy` so this service — which
  // is `providedIn: 'root'` — doesn't leak across navigations.
  destroy(): void {
    this._config?.legacy.destroy();
    this._config = undefined;
    this._dataSource = undefined;
  }
}

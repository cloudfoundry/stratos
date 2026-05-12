import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';

import { EndpointsSignalService, PageHeaderComponent } from '@stratosui/core';
import { HELM_ENDPOINT_TYPE } from '../helm-entity-factory';

// Wave-3 K-helm-consumers: replaces the legacy Store + endpointOfTypeSelector
// read with EndpointsSignalService + a computed signal that derives the helm
// endpoint guids. PageHeaderComponent still wants an Observable<string[]>
// so the computed is bridged via toObservable().
@Component({
  selector: 'app-monocular-tab-base',
  templateUrl: './monocular-tab-base.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    RouterOutlet
  ]
})
export class MonocularTabBaseComponent {
  private endpointsSignals = inject(EndpointsSignalService);

  // Helm endpoint guids derived from the endpoint slice signal. Mirrors the
  // legacy `endpointOfTypeSelector(HELM_ENDPOINT_TYPE)` filter (cnsi_type)
  // and projects to the GUID list that PageHeaderComponent renders as chips.
  private readonly helmEndpointIds = computed(() =>
    Object.values(this.endpointsSignals.endpoints())
      .filter(ep => ep?.cnsi_type === HELM_ENDPOINT_TYPE)
      .map(ep => ep.guid),
  );

  public readonly endpointIds$: Observable<string[]> = toObservable(this.helmEndpointIds);
}

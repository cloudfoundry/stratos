import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { EndpointsSignalService, PageHeaderComponent } from '@stratosui/core';
import { HELM_ENDPOINT_TYPE } from '../helm-entity-factory';

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
  public readonly helmEndpointIds = computed(() =>
    Object.values(this.endpointsSignals.endpoints())
      .filter(ep => ep?.cnsi_type === HELM_ENDPOINT_TYPE)
      .map(ep => ep.guid)
      .filter((guid): guid is string => !!guid),
  );
}

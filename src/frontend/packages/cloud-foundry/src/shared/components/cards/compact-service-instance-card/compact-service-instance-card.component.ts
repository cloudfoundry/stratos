import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AppChip, AppChipsComponent } from '@stratosui/core';
import { StServiceInstance } from '../../../../services/endpoint-data/stratos-types';

/**
 * CompactServiceInstanceCardComponent — single-row preview of a service
 * instance (name + tags + updated-at), embedded in the Summary tab's
 * recent-instances list.
 *
 * Stage 9b-2: input shape moved from APIResource<IServiceInstance> to the
 * V3-native StServiceInstance so the Summary tab can read directly from
 * EndpointDataService._serviceInstances() without a wire-shape adapter.
 */
@Component({
  selector: 'app-compact-service-instance-card',
  templateUrl: './compact-service-instance-card.component.html',
  styleUrls: ['./compact-service-instance-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppChipsComponent,
  ],
})
export class CompactServiceInstanceCardComponent {
  serviceInstanceTags: AppChip[] = [];

  private _serviceInstance: StServiceInstance | null = null;

  @Input()
  get serviceInstance(): StServiceInstance | null {
    return this._serviceInstance;
  }

  set serviceInstance(value: StServiceInstance | null) {
    this._serviceInstance = value;
    const tags = value?.tags ?? [];
    this.serviceInstanceTags = tags.map(t => ({ value: t }));
  }
}

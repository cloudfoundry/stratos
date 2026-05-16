import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { take, filter, map, publishReplay, refCount } from 'rxjs/operators';

import { CardCell } from '../../../../../core/src/shared/components/list/list.types';
import { EndpointsDataService } from '../../../../../store/src/services/endpoints-data.service';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE, HELM_REPO_ENDPOINT_TYPE } from '../../helm-entity-factory';
import { ChartItemComponent } from '../../monocular/chart-item/chart-item.component';
import { MonocularChart } from '../../store/helm.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-monocular-chart-card',
  templateUrl: './monocular-chart-card.component.html',

  standalone: true,
  imports: [ChartItemComponent]
})
export class MonocularChartCardComponent extends CardCell<MonocularChart> {

  public artifactHubAndHelmRepoTypes$: Observable<boolean>;
  private endpointsData = inject(EndpointsDataService);

  constructor() {
    super();
    // W36-B Wave 3: source endpoints from EndpointsDataService signal
    // bridge instead of legacy ngrx PaginationService.
    this.artifactHubAndHelmRepoTypes$ = toObservable(this.endpointsData.endpointsList).pipe(
      filter(endpoints => !!endpoints), // Wait until we have some entities
      take(1),
      map(endpoints => {
        let haveArtifactHub = false;
        let haveHelmRepo = false;
        for (const ep of endpoints) {
          if (ep.cnsi_type !== HELM_ENDPOINT_TYPE) {
            continue;
          }

          if (ep.sub_type === HELM_HUB_ENDPOINT_TYPE) {
            haveArtifactHub = true;
          } else if (ep.sub_type === HELM_REPO_ENDPOINT_TYPE) {
            haveHelmRepo = true;
          }

          if (haveArtifactHub && haveHelmRepo) {
            return true;
          }
        }
        return false;
      }),
      publishReplay(1),
      refCount()
    );
  }
}

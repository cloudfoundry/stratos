import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount } from 'rxjs/operators';

import { CardCell } from '../../../../../core/src/shared/components/list/list.types';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE, HELM_REPO_ENDPOINT_TYPE } from '../../helm-entity-factory';
import { MonocularChart } from '../../store/helm.types';

@Component({
  selector: 'app-monocular-chart-card',
  templateUrl: './monocular-chart-card.component.html',
  styleUrls: ['./monocular-chart-card.component.scss']
})
export class MonocularChartCardComponent extends CardCell<MonocularChart> {

  @Input() row: MonocularChart;

  public artifactHubAndHelmRepoTypes$: Observable<boolean>;

  constructor() {
    super();
    this.artifactHubAndHelmRepoTypes$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
      filter(endpoints => !!endpoints), // Wait until we have some entities
      first(),
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

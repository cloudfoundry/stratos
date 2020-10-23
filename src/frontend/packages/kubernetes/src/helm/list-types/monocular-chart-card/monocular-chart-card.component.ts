import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, first, map, publishReplay, refCount } from 'rxjs/operators';

import { CardCell } from '../../../../../core/src/shared/components/list/list.types';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { HELM_HUB_ENDPOINT_TYPE } from '../../helm-entity-factory';
import { MonocularChart } from '../../store/helm.types';

@Component({
  selector: 'app-monocular-chart-card',
  templateUrl: './monocular-chart-card.component.html',
  styleUrls: ['./monocular-chart-card.component.scss']
})
export class MonocularChartCardComponent extends CardCell<MonocularChart> {

  @Input() row: MonocularChart;

  public artifactHubAndOthers$: Observable<boolean>;

  constructor() {
    super();
    this.artifactHubAndOthers$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationService().entities$.pipe(
      filter(entities => !!entities),
      first(),
      map(endpoints => !!endpoints.find(ep => ep.sub_type === HELM_HUB_ENDPOINT_TYPE) && endpoints.length > 1),
      publishReplay(1),
      refCount()
    );
  }
}

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';

@Component({
  selector: 'app-container-orchestrator-stepper',
  templateUrl: './container-orchestrator-stepper.component.html',
  styleUrls: ['./container-orchestrator-stepper.component.scss']
})
export class ContainerOrchestratorStepperComponent {

  cfName$: Observable<string>;
  cancelUrl = '/endpoints';

  constructor(
    store: Store<AppState>,
    activatedRoute: ActivatedRoute,
  ) {
    const cfGuid = activatedRoute.snapshot.params.endpointId;
    if (activatedRoute.snapshot.queryParamMap.get('cf')) {
      this.cancelUrl = `/cloud-foundry/${cfGuid}/summary`;
    }
    this.cfName$ = stratosEntityCatalog.endpoint.store.getEntityService(cfGuid).waitForEntity$.pipe(
      map(endpoint => endpoint.entity.name)
    );
  }

}

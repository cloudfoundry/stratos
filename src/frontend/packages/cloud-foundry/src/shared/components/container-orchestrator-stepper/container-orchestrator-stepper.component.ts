import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { selectEntity } from '../../../../../store/src/selectors/api.selectors';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';

@Component({
  selector: 'cf-container-orchestrator-stepper',
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
    this.cfName$ = store.select(selectEntity<EndpointModel>(endpointSchemaKey, cfGuid)).pipe(
      filter(endpoint => !!endpoint),
      map(endpoint => endpoint.name)
    );
  }

}

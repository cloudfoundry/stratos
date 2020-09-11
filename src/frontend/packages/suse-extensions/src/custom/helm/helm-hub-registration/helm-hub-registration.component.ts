import { Component } from '@angular/core';
import { filter, map, pairwise } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { ActionState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE } from '../helm-entity-factory';

@Component({
  selector: 'app-helm-hub-registration',
  templateUrl: './helm-hub-registration.component.html',
  styleUrls: ['./helm-hub-registration.component.scss']
})
export class HelmHubRegistrationComponent {

  onNext: StepOnNextFunction = () => {
    return stratosEntityCatalog.endpoint.api.register<ActionState>(
      HELM_ENDPOINT_TYPE,
      HELM_HUB_ENDPOINT_TYPE,
      'Helm Hub',
      'https://hub.helm.sh/api',
      false
    ).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      map(state => ({
        success: !state.error,
        message: state.message,
        redirect: !state.error
      }))
    );
  };

}

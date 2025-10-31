import { ChangeDetectionStrategy, Component} from '@angular/core';
import { filter, map, pairwise } from 'rxjs/operators';

import { StepComponent } from '../../../../core/src/shared/components/stepper/step/step.component';
import { StepOnNextFunction } from '../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE } from '../helm-entity-factory';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-helm-hub-registration',
  templateUrl: './helm-hub-registration.component.html',
  styleUrls: ['./helm-hub-registration.component.scss'],
  standalone: true,
  imports: [
    SteppersComponent,
    StepComponent
  ]
})
export class HelmHubRegistrationComponent {

  onNext: StepOnNextFunction = () => {
    return stratosEntityCatalog.endpoint.api.register<ActionState>(
      HELM_ENDPOINT_TYPE,
      HELM_HUB_ENDPOINT_TYPE,
      'Artifact Hub',
      'https://artifacthub.io',
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

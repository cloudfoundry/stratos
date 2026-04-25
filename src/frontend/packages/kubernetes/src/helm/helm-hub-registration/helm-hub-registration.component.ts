import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { filter, pairwise, take } from 'rxjs/operators';

import { SignalStepHandle, StepComponent } from '../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';
import { HELM_ENDPOINT_TYPE, HELM_HUB_ENDPOINT_TYPE } from '../helm-entity-factory';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-helm-hub-registration',
  templateUrl: './helm-hub-registration.component.html',

  standalone: true,
  imports: [
    SteppersComponent,
    StepComponent
  ]
})
export class HelmHubRegistrationComponent {
  private router = inject(Router);

  registerStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    submit: () => this.runRegister(),
  };

  private runRegister(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      stratosEntityCatalog.endpoint.api.register<ActionState>(
        HELM_ENDPOINT_TYPE,
        HELM_HUB_ENDPOINT_TYPE,
        'Artifact Hub',
        'https://artifacthub.io',
        false
      ).pipe(
        pairwise(),
        filter(([oldV, newV]) => oldV.busy && !newV.busy),
        take(1),
      ).subscribe({
        next: ([, newV]) => {
          if (newV.error) {
            reject(new Error(newV.message || 'Failed to register Artifact Hub'));
          } else {
            this.router.navigate(['/endpoints']).then(() => resolve());
          }
        },
        error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
      });
    });
  }
}

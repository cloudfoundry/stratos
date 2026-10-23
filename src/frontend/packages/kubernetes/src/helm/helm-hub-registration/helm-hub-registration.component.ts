import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ENDPOINT_REGISTER_HANDLE, leaveEndpointRegistration } from '../../../../core/src/features/endpoints/endpoint-register-modal/endpoint-register-handle';
import { EndpointsSignalConfigService } from '../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import { SignalStepHandle, StepComponent } from '../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../core/src/shared/components/stepper/steppers/steppers.component';
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
  private endpointsSignalConfig = inject(EndpointsSignalConfigService);
  // Present when hosted by the Register Endpoint dialog, which this form
  // closes instead of navigating to /endpoints (the page under the dialog).
  private registerHandle = inject(ENDPOINT_REGISTER_HANDLE, { optional: true });
  readonly cancelAction = this.registerHandle ? () => this.registerHandle!.close(false) : undefined;

  registerStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    submit: () => this.runRegister(),
  };

  private async runRegister(): Promise<void> {
    const result = await this.endpointsSignalConfig.register({
      endpointType: HELM_ENDPOINT_TYPE,
      endpointSubType: HELM_HUB_ENDPOINT_TYPE,
      name: 'Artifact Hub',
      endpoint: 'https://artifacthub.io',
      skipSslValidation: false,
    });
    if (result.error) {
      throw new Error(result.message || 'Failed to register Artifact Hub');
    }
    await leaveEndpointRegistration(this.registerHandle, this.router, true);
  }
}

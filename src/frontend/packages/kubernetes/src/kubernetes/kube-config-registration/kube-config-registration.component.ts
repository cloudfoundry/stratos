// FWT-957 DEFERRED: multi-step migration needs per-stepper signal service.
// KubeConfigRegistration is 2 steps with cross-step state via the importer's
// `applyStarted` flag, the selector→importer cluster list passed through
// the legacy `onNext` data return, and dynamic per-step button/label state
// (canClose, destructiveStep, finishButtonText). Shape 3 migration requires
// surfacing all of that through signal-shaped state on the children.
import { ChangeDetectionStrategy, Component} from '@angular/core';
import { CommonModule } from '@angular/common';

import { SteppersComponent, StepComponent } from '@stratosui/core';
import { KubeConfigSelectionComponent } from './kube-config-selection/kube-config-selection.component';
import { KubeConfigImportComponent } from './kube-config-import/kube-config-import.component';

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-config-registration',
  templateUrl: './kube-config-registration.component.html',

  standalone: true,
  imports: [
    CommonModule,
    SteppersComponent,
    StepComponent,
    KubeConfigSelectionComponent,
    KubeConfigImportComponent
  ]
})
export class KubeConfigRegistrationComponent { }

import { ChangeDetectionStrategy, Component} from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';

import { SteppersComponent, StepComponent } from '@stratosui/core';
import { KubeConfigSelectionComponent } from './kube-config-selection/kube-config-selection.component';
import { KubeConfigImportComponent } from './kube-config-import/kube-config-import.component';

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-config-registration',
  templateUrl: './kube-config-registration.component.html',
  styleUrls: ['./kube-config-registration.component.scss'],
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

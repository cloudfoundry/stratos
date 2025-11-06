import { ChangeDetectionStrategy, Component} from '@angular/core';
import { CardCell } from '@stratosui/core';
import { MetaCardComponent } from '@stratosui/core';
import { MetaCardItemComponent } from '@stratosui/core';
import { MetaCardKeyComponent } from '@stratosui/core';
import { MetaCardTitleComponent } from '@stratosui/core';
import { MetaCardValueComponent } from '@stratosui/core';
import { MultilineTitleComponent } from '@stratosui/core';

import { KubeService } from '../../../store/kube.types';
import { KubernetesServicePortsComponent } from '../../kubernetes-service-ports/kubernetes-service-ports.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-service-card',
  templateUrl: './kubernetes-service-card.component.html',
  styleUrls: ['./kubernetes-service-card.component.scss'],
  standalone: true,
  imports: [
    MetaCardComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardTitleComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    KubernetesServicePortsComponent
  ]
})
export class KubeServiceCardComponent extends CardCell<KubeService> {
  constructor() {
    super();
  }
}

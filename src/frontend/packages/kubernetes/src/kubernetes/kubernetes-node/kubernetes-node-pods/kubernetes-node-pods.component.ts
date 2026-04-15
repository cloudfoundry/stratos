import { ChangeDetectionStrategy, Component} from '@angular/core';

import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import {
  KubernetesNodePodsListConfigService,
} from '../../list-types/kubernetes-node-pods/kubernetes-node-pods-list-config.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-node-pods',
  templateUrl: './kubernetes-node-pods.component.html',

  providers: [{
    provide: ListConfig,
    useClass: KubernetesNodePodsListConfigService,
  }],
  standalone: true,
  imports: [
    ListComponent
  ]
})
export class KubernetesNodePodsComponent { }

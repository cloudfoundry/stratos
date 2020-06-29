import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  KubernetesNodePodsListConfigService,
} from '../../list-types/kubernetes-node-pods/kubernetes-node-pods-list-config.service';

@Component({
  selector: 'app-kubernetes-node-pods',
  templateUrl: './kubernetes-node-pods.component.html',
  styleUrls: ['./kubernetes-node-pods.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNodePodsListConfigService,
  }]
})
export class KubernetesNodePodsComponent { }

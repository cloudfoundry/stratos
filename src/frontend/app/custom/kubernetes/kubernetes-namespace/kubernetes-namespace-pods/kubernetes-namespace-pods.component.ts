import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import {
  KubernetesNamespacePodsListConfigService,
} from '../../list-types/kubernetes-namespace-pods/kubernetes-namespace-pods-list-config.service';

@Component({
  selector: 'app-kubernetes-namespace-pods',
  templateUrl: './kubernetes-namespace-pods.component.html',
  styleUrls: ['./kubernetes-namespace-pods.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNamespacePodsListConfigService,
  }]
})
export class KubernetesNamespacePodsComponent {}

import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import {
  KubernetesNamespaceServicesListConfig,
} from '../../list-types/kubernetes-namespace-services/kubernetes-namespace-services-list-config.service';

@Component({
  selector: 'app-kubernetes-namespace-services',
  templateUrl: './kubernetes-namespace-services.component.html',
  styleUrls: ['./kubernetes-namespace-services.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNamespaceServicesListConfig,
  }]
})
export class KubernetesNamespaceServicesComponent {


}

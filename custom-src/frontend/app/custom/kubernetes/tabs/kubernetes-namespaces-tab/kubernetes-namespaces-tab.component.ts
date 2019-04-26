import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { KubernetesNamespacesListConfigService } from '../../list-types/kubernetes-namespaces/kubernetes-namespaces-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-kubernetes-namespaces-tab',
  templateUrl: './kubernetes-namespaces-tab.component.html',
  styleUrls: ['./kubernetes-namespaces-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNamespacesListConfigService,
  }]
})
export class KubernetesNamespacesTabComponent {

  constructor(private activatedRoute: ActivatedRoute) {}
}

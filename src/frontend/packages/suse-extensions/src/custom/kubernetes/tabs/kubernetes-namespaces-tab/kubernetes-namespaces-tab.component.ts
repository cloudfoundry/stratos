import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import {
  KubernetesNamespacesListConfigService,
} from '../../list-types/kubernetes-namespaces/kubernetes-namespaces-list-config.service';

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

  constructor(private activatedRoute: ActivatedRoute) { }
}

import { Component } from '@angular/core';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { KubernetesNodesListConfigService } from '../../list-types/kubernetes-nodes/kubernetes-nodes-list-config.service';

@Component({
  selector: 'app-kubernetes-nodes-tab',
  templateUrl: './kubernetes-nodes-tab.component.html',
  styleUrls: ['./kubernetes-nodes-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNodesListConfigService,
  }]
})
export class KubernetesNodesTabComponent {

  constructor() { }

}

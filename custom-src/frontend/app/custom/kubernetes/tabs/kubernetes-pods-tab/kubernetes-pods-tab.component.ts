import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { KubernetesPodsListConfigService } from '../../list-types/kubernetes-pods/kubernetes-pods-list-config.service';

@Component({
  selector: 'app-kubernetes-pods-tab',
  templateUrl: './kubernetes-pods-tab.component.html',
  styleUrls: ['./kubernetes-pods-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesPodsListConfigService,
  }]
})
export class KubernetesPodsTabComponent {}

import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { KubernetesAppsListConfigService } from '../../list-types/kubernetes-apps/kubernetes-apps-list-config.service';

@Component({
  selector: 'app-kubernetes-apps-tab',
  templateUrl: './kubernetes-apps-tab.component.html',
  styleUrls: ['./kubernetes-apps-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesAppsListConfigService,
  }]
})
export class KubernetesAppsTabComponent { }

import { Component, OnInit } from '@angular/core';
import { KubernetesAppsListConfigService } from '../../list-types/kubernetes-apps/kubernetes-apps-list-config.service';
import { ListConfig } from '../../../../../../../src/frontend/app/shared/components/list/list.component.types';

@Component({
  selector: 'app-kubernetes-apps-tab',
  templateUrl: './kubernetes-apps-tab.component.html',
  styleUrls: ['./kubernetes-apps-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesAppsListConfigService,
  }]
})
export class KubernetesAppsTabComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

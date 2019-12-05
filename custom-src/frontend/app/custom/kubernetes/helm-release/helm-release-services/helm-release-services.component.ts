import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import {
  KubernetesReleaseServicesListConfig,
} from '../../list-types/kubernetes-release-services/kubernetes-release-services-list-config.service';

@Component({
  selector: 'app-helm-release-services',
  templateUrl: './helm-release-services.component.html',
  styleUrls: ['./helm-release-services.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesReleaseServicesListConfig,
  }]
})
export class HelmReleaseServicesComponent { }

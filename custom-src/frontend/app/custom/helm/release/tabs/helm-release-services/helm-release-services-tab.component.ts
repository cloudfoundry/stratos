import { Component } from '@angular/core';

import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { HelmReleaseServicesListConfig } from '../../../list-types/monocular-release-services-list-config.service';

@Component({
  selector: 'app-helm-release-services-tab',
  templateUrl: './helm-release-services-tab.component.html',
  styleUrls: ['./helm-release-services-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: HelmReleaseServicesListConfig,
  }]
})
export class HelmReleaseServicesTabComponent { }

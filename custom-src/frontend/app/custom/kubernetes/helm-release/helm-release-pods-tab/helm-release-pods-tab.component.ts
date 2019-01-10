import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { HelmReleasePodsListConfigService } from '../../list-types/helm-release-pods/helm-release-pods-list-config.service';

@Component({
  selector: 'app-helm-release-pods-tab',
  templateUrl: './helm-release-pods-tab.component.html',
  styleUrls: ['./helm-release-pods-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: HelmReleasePodsListConfigService,
  }]
})
export class HelmReleasePodsTabComponent { }

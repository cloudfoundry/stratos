import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { HelmVersionsListConfig } from '../../list-types/monocular-versions-list-config.service';

@Component({
  selector: 'app-helm-configuration',
  templateUrl: './helm-configuration.component.html',
  styleUrls: ['./helm-configuration.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: HelmVersionsListConfig,
  }]
})
export class HelmConfigurationComponent { }


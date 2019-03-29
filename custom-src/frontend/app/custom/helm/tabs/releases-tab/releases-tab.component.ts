import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { HelmReleasesListConfig } from '../../list-types/monocular-releases-list-config.service';

@Component({
  selector: 'app-releases-tab',
  templateUrl: './releases-tab.component.html',
  styleUrls: ['./releases-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: HelmReleasesListConfig,
  }]
})
export class HelmReleasesTabComponent { }


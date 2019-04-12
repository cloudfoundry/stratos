import { Component } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { MonocularChartsListConfig } from './../../list-types/monocular-charts-list-config.service';

@Component({
  selector: 'app-catalog-tab',
  templateUrl: './catalog-tab.component.html',
  styleUrls: ['./catalog-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: MonocularChartsListConfig,
  }]

})
export class CatalogTabComponent { }


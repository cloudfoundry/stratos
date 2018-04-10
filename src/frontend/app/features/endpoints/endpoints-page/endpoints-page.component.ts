import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { EndpointsService } from '../../../core/endpoints.service';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { GetSystemInfo } from '../../../store/actions/system.actions';
import { AppState } from '../../../store/app-state';


@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }]
})
export class EndpointsPageComponent {
  constructor(private store: Store<AppState>, public endpointsService: EndpointsService) {
    this.store.dispatch(new GetSystemInfo());
  }
}

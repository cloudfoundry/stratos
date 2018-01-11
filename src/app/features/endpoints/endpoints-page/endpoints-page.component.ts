import { CardComponent } from '../../../shared/components/cards/card/card.component';
import { GetSystemInfo } from './../../../store/actions/system.actions';
import { SystemEffects } from './../../../store/effects/system.effects';
import { Store } from '@ngrx/store';
import { CNSISModel } from '../../../store/types/cnsis.types';
import { ListConfig } from '../../../shared/components/list/list.component';
import { EndpointsListConfigService } from '../../../shared/list-configs/endpoints-list-config.service';
import { Component } from '@angular/core';
import { AppState } from '../../../store/app-state';
import { EndpointsService } from '../../../core/endpoints.service';
import { CardEndpointComponent } from '../../../shared/components/cards/custom-cards/card-endpoint/card-endpoint.component';

function getEndpointTypeString(endpoint: CNSISModel): string {
  return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
}

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
  cardComponent = CardEndpointComponent;
  constructor(private store: Store<AppState>, public endpointsService: EndpointsService) {
    this.store.dispatch(new GetSystemInfo());
  }
}

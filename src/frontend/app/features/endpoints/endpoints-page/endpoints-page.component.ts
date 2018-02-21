import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { EndpointsService } from '../../../core/endpoints.service';
import {
  EndpointsListConfigService,
} from '../../../shared/components/list/list-types/endpoint/endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { AppState } from '../../../store/app-state';
import { EndpointModel } from '../../../store/types/endpoint.types';
import { GetSystemInfo } from './../../../store/actions/system.actions';
import { endpointStatusSelector, endpointEntitiesSelector } from '../../../store/selectors/endpoint.selectors';
import { Http, Headers } from '@angular/http';

function getEndpointTypeString(endpoint: EndpointModel): string {
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
  constructor(private http: Http, private store: Store<AppState>, public endpointsService: EndpointsService) {
    this.store.dispatch(new GetSystemInfo());
  }

  testKubernetes() {
    console.log('TESTING.....');

    this.store.select(endpointEntitiesSelector).take(1).do(ep => {
      console.log(ep);

      Object.keys(ep).forEach(guid => {
        const endpoint = ep[guid];
        if (endpoint.cnsi_type === 'k8s' && endpoint.user) {
          console.log('Testing: ' + guid);

          const headers = new Headers({ 'x-cap-cnsi-list': guid });
          const requestArgs = {
            headers: headers
          };
          this.http.get(`/pp/v1/proxy/api/v1/nodes`, requestArgs).subscribe();
        }
      })

    }).subscribe();
  }


}

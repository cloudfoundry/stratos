import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { first, tap } from 'rxjs/operators';

import {
  CFEndpointsListConfigService,
} from '../../../shared/components/list/list-types/cf-endpoints/cf-endpoints-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { AppState } from '../../../store/app-state';
import { CloudFoundryService } from '../cloud-foundry.service';

@Component({
  selector: 'app-cloud-foundry',
  templateUrl: './cloud-foundry.component.html',
  styleUrls: ['./cloud-foundry.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CFEndpointsListConfigService,
  }]
})
export class CloudFoundryComponent {
  constructor(
    private store: Store<AppState>,
    private cfService: CloudFoundryService
  ) {
    cfService.cFEndpoints$.pipe(
      tap(cfEndpoints => {
        const connectedEndpoints = cfEndpoints.filter(
          c => c.connectionStatus === 'connected'
        );
        if (connectedEndpoints.length === 1) {
          // this.store.dispatch(
          //   new RouterNav({ path: ['cloud-foundry', cfEndpoints[0].guid] })
          // );
        }
      }),
      first()
    ).subscribe();

  }
}

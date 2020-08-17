import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { CFAppState } from '../../../cf-app-state';
import {
  CFEndpointsListConfigService,
} from '../../../shared/components/list/list-types/cf-endpoints/cf-endpoints-list-config.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';

@Component({
  selector: 'app-cloud-foundry',
  templateUrl: './cloud-foundry.component.html',
  styleUrls: ['./cloud-foundry.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CFEndpointsListConfigService,
    },
    CloudFoundryService
  ]
})
export class CloudFoundryComponent {
  connectedEndpoints$: Observable<number>;
  constructor(
    private store: Store<CFAppState>,
    cfService: CloudFoundryService
  ) {
    this.connectedEndpoints$ = cfService.connectedCFEndpoints$.pipe(
      map(connectedEndpoints => {
        const hasOne = connectedEndpoints.length === 1;
        if (hasOne) {
          this.store.dispatch(new RouterNav({
            path: ['cloud-foundry', connectedEndpoints[0].guid]
          }));
        }
        return connectedEndpoints.length;
      }),
      first()
    );
  }
}

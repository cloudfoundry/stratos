import { Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { ListConfig } from '../../../shared/components/list/list.component.types';
import { RouterNav } from '../../../store/actions/router.actions';
import { AppState } from '../../../store/app-state';
import { CaaspEndpointsListConfigService } from '../list-types/caasp-endpoints/caasp-endpoints-list-config.service';
import { CaaspService } from '../services/cassp-service';

import { filter, first, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-caasp',
  templateUrl: './caasp.component.html',
  styleUrls: ['./caasp.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CaaspEndpointsListConfigService,
  }]
})
export class CaaspComponent {
  hasOneCaasp$: Observable<boolean>;
  constructor(
    private store: Store<AppState>,
    private caaspService: CaaspService
  ) {
    this.hasOneCaasp$ = caaspService.caaspEndpoints$.pipe(
      map(caaspEndpoints => {
        const connectedEndpoints = caaspEndpoints.filter(
          c => c.connectionStatus === 'connected'
        );
        const hasOne = connectedEndpoints.length === 1;
        if (hasOne) {
          this.store.dispatch(new RouterNav({
            path: ['caasp', connectedEndpoints[0].guid]
          }));
        }
        return connectedEndpoints.length === 1;
      }),
      filter(hasOne => !hasOne),
      first()
    );

  }
}

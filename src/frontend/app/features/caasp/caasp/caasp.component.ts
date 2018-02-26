import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, first, map } from 'rxjs/operators';
import { RouterNav } from '../../../store/actions/router.actions';
import { AppState } from '../../../store/app-state';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { CaaspService } from '../services/cassp-service';
import { CaaspEndpointsListConfigService } from '../../../shared/components/list/list-types/caasp-endpoints/caasp-endpoints-list-config.service';

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
        console.log(caaspEndpoints);
        return connectedEndpoints.length === 1;
      }),
      filter(hasOne => !hasOne),
      first()
    );

  }
}

import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { EndpointsService } from '../../../core/endpoints.service';
import { RouterNav } from '../../../../../store/src/actions/router.actions';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
  public allEndpointIds$: Observable<string[]>;
  public haveRegistered$: Observable<boolean>;

  constructor(endpointsService: EndpointsService, private store: Store<AppState>) {
    this.allEndpointIds$ = endpointsService.endpoints$.pipe(
      map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
    );
    this.haveRegistered$ = endpointsService.haveRegistered$;

    // Redirect to /applications if not enabled
    endpointsService.disablePersistenceFeatures$.pipe(
      map(off => {
        if (off) {
          this.store.dispatch(new RouterNav({
            path: ['applications']
          }));
        }
      }),
      first()
    ).subscribe();
  }
}


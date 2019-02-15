import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EndpointsService } from '../../../core/endpoints.service';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
  public allEndpointIds$: Observable<string[]>;
  public haveRegistered$: Observable<boolean>;

  constructor(endpointsService: EndpointsService, store: Store<AppState>) {
    this.allEndpointIds$ = endpointsService.endpoints$.pipe(
      map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
    );
    this.haveRegistered$ = endpointsService.haveRegistered$;
  }
}


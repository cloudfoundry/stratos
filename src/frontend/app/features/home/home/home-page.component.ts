import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { AppState } from '../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { endpointListKey } from '../../../store/types/endpoint.types';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {
  public allEndpointIds$: Observable<string>;

  constructor(store: Store<AppState>) {
    this.allEndpointIds$ = new PaginationMonitor(store, endpointListKey, entityFactory(endpointSchemaKey)).currentPageIds$;
  }
}


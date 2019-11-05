import { Component, OnInit } from '@angular/core';
import { GeneralAppState } from '../../../../../store/src/app-state';
import { Observable } from 'rxjs';
import { ApiEntityType } from '../../api-drive-views.types';
import { Store } from '@ngrx/store';
import { connectedEndpointsOfTypesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-api-endpoint-select-page',
  templateUrl: './api-endpoint-select-page.component.html',
  styleUrls: ['./api-endpoint-select-page.component.scss']
})
export class ApiEndpointSelectPageComponent implements OnInit {
  public connectedEndpointsOfType$: Observable<ApiEntityType[]>;
  constructor(
    private store: Store<GeneralAppState>,
    private route: ActivatedRoute,
    private router: Router
  ) { }
  public endpointSelected(endpoint: ApiEntityType) {
    this.router.navigate([endpoint.type], { relativeTo: this.route });
  }
  ngOnInit() {
    const endpointType = this.route.snapshot.params.endpointType;

    this.connectedEndpointsOfType$ = this.store.select(connectedEndpointsOfTypesSelector(endpointType)).pipe(
      map(endpoints => Object.values(endpoints).map(endpoint => new ApiEntityType(
        endpoint.guid,
        endpoint.name
        //  TODO Get icon from entity catalogue
      )))
    );
  }

}

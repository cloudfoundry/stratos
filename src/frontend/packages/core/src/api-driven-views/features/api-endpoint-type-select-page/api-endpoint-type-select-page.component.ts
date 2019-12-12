import { Component, OnInit } from '@angular/core';
import { GeneralAppState } from '../../../../../store/src/app-state';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ApiEntityType } from '../../api-drive-views.types';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { endpointEntitiesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-api-endpoint-type-select-page',
  templateUrl: './api-endpoint-type-select-page.component.html',
  styleUrls: ['./api-endpoint-type-select-page.component.scss']
})
export class ApiEndpointTypeSelectPageComponent implements OnInit {
  public connectedEndpointTypes$: Observable<ApiEntityType[]>;
  constructor(
    public store: Store<GeneralAppState>,
    public router: Router,
    public activeRoute: ActivatedRoute
  ) { }
  public endpointSelected(endpoint: ApiEntityType) {
    console.log(endpoint);
    this.router.navigate([endpoint.type], { relativeTo: this.activeRoute });
  }
  ngOnInit() {
    const endpointTypes = entityCatalog.getAllEndpointTypes();
    const endpointTypesWithEntities = endpointTypes
      .filter(endpointType => entityCatalog.getAllEntitiesForEndpointType(endpointType.type).length > 0);
    this.connectedEndpointTypes$ = this.store.select(endpointEntitiesSelector).pipe(
      map(endpoints => {
        const endpointTypeSet = new Set<string>();
        Object.values(endpoints).forEach(endpoint => {
          if (endpoint.connectionStatus === 'connected') {
            endpointTypeSet.add(endpoint.cnsi_type);
          }
        });
        return Array.from(endpointTypeSet)
          .map(type => endpointTypesWithEntities.find(endpoint => endpoint.type === type))
          .filter(endpoint => !!endpoint)
          .map(endpoint => new ApiEntityType(endpoint.type, endpoint.definition.label, endpoint.definition.logoUrl));
      })
    );
  }

}

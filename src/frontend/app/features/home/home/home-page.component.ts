import { EndpointModel } from './../../../store/types/endpoint.types';
import { DrillDownDefinition } from './../../../shared/components/drill-down/drill-down.component';
import { PaginationMonitorFactory } from './../../../shared/monitors/pagination-monitor.factory';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { of, Observable } from 'rxjs';
import { AppState } from '../../../store/app-state';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { entityFactory, endpointSchemaKey, organizationSchemaKey, spaceSchemaKey } from '../../../store/helpers/entity-factory';
import { map } from 'rxjs/operators';
import { CloudFoundryEndpointService } from '../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { IOrganization, ISpace } from '../../../core/cf-api.types';
import { APIResource } from '../../../store/types/api.types';
import { createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations/entity-relations.types';
import { GetAllOrganizationSpaces } from '../../../store/actions/organization.actions';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  public definition: DrillDownDefinition;

  constructor(store: Store<AppState>, paginationMonitorFactory: PaginationMonitorFactory) {

    this.definition = [
      {
        title: 'cf',
        request: {
          data$: paginationMonitorFactory
            .create<EndpointModel>(CloudFoundryService.EndpointList, entityFactory(endpointSchemaKey)).currentPage$
        }
      },
      {
        title: '2',
        selectItem: (cf: EndpointModel) => {
          const action = CloudFoundryEndpointService.createGetAllOrganizations(cf.guid);
          action.includeRelations = [];
          store.dispatch(action);
        },
        request: (cf: EndpointModel) => {
          const action = CloudFoundryEndpointService.createGetAllOrganizations(cf.guid);
          const monitor = paginationMonitorFactory
            .create<APIResource<IOrganization>>(action.paginationKey, entityFactory(organizationSchemaKey))
          return {
            data$: monitor.currentPage$,
            state$: monitor.currentPageRequestState$
          }
        }
      },
      {
        title: '3',
        selectItem: (
          org: APIResource<IOrganization>,
          [cf]: [EndpointModel]
        ) => {
          const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, org.entity.guid);
          store.dispatch(new GetAllOrganizationSpaces(
            paginationKey,
            org.entity.guid,
            cf.guid
          ));
        },
        request: (org: APIResource<IOrganization>) => {
          const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, org.entity.guid);
          const monitor = paginationMonitorFactory
            .create<APIResource<ISpace>>(paginationKey, entityFactory(spaceSchemaKey));
          return {
            data$: monitor.currentPage$,
            state$: monitor.currentPageRequestState$
          }
        }
      }
    ];
  }

  ngOnInit() { }
}

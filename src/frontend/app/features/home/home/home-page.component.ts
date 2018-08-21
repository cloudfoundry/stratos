import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { IApp, IOrganization, ISpace } from '../../../core/cf-api.types';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { GetAllOrganizationSpaces } from '../../../store/actions/organization.actions';
import { GetAllAppsInSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import { endpointSchemaKey, entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../store/types/api.types';
import { CloudFoundryEndpointService } from '../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { DrillDownDefinition } from './../../../shared/components/drill-down/drill-down.component';
import { PaginationMonitorFactory } from './../../../shared/monitors/pagination-monitor.factory';
import { applicationSchemaKey } from './../../../store/helpers/entity-factory';
import { EndpointModel } from './../../../store/types/endpoint.types';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginatedAction } from '../../../store/types/pagination.types';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { ApiRequestDrillDownLevel } from '../../../shared/components/drill-down/drill-down-levels/api-request-drill-down-level';
import { CardAppComponent } from '../../../shared/components/list/list-types/app/card/card-app.component';
import { CfEndpointCardComponent } from '../../../shared/components/list/list-types/cf-endpoints/cf-endpoint-card/endpoint-card.component';
import { CfOrgCardComponent } from '../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { getActiveRouteCfOrgSpaceProvider } from '../../cloud-foundry/cf.helpers';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { CloudFoundryOrganizationService } from '../../cloud-foundry/services/cloud-foundry-organization.service';
import { CfSpaceCardComponent } from '../../../shared/components/list/list-types/cf-spaces/cf-space-card/cf-space-card.component';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService
  ]
})
export class HomePageComponent implements OnInit {
  public definition: DrillDownDefinition;

  public getPagination(action: PaginatedAction, paginationMonitor: PaginationMonitor) {
    return getPaginationObservables({
      store: this.store,
      action,
      paginationMonitor
    });
  }

  constructor(private store: Store<AppState>, paginationMonitorFactory: PaginationMonitorFactory) {
    this.definition = [
      {
        title: 'Cloud Foundrys',
        component: CfEndpointCardComponent,
        request: {
          data$: paginationMonitorFactory
            .create<EndpointModel>(CloudFoundryService.EndpointList, entityFactory(endpointSchemaKey)).currentPage$
        }
      },
      {
        component: CfOrgCardComponent,
        ...new ApiRequestDrillDownLevel(this.store, {
          title: 'Organizations',

          getAction: (cf: EndpointModel) => {
            const action = CloudFoundryEndpointService.createGetAllOrganizations(cf.guid);
            action.paginationKey += '-drill-down';
            action.includeRelations = [];
            return action;
          }
        })
      },
      {
        component: CfSpaceCardComponent,
        ...new ApiRequestDrillDownLevel(this.store, {
          title: 'Spaces',
          getAction: (org: APIResource<IOrganization>, [cf]: [EndpointModel]) => {
            const action = new GetAllOrganizationSpaces(
              createEntityRelationPaginationKey(organizationSchemaKey, org.entity.guid) + '-drill-down',
              org.entity.guid,
              cf.guid
            );
            action.initialParams['results-per-page'] = 50;
            action.flattenPagination = false;
            return action;
          }
        })
      },
      {
        component: CardAppComponent,
        ...new ApiRequestDrillDownLevel(this.store, {
          title: 'Applications',
          getAction: (space: APIResource<ISpace>, [cf]: [EndpointModel]) => new GetAllAppsInSpace(
            cf.guid,
            space.entity.guid,
            createEntityRelationPaginationKey(spaceSchemaKey, space.entity.guid) + '-drill-down'
          ),

        })
      }
    ];
  }

  ngOnInit() { }
}

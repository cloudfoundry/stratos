import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { IOrganization } from '../../../../../../core/src/core/cf-api.types';
import { CurrentUserPermissions } from '../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/current-user-permissions.service';
import { entityCatalogue } from '../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  IListDataSourceConfig,
} from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-config';
import {
  ListDefaultsActionOrConfig,
} from '../../../../../../core/src/shared/components/list/defaults-list/defaults-datasource';
import {
  ActionListConfigProvider,
  EntityConfigListConfigProvider,
} from '../../../../../../core/src/shared/components/list/list-configs/list-config-providers';
import { IListConfig, ListViewTypes } from '../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../store/src/types/pagination.types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import {
  domainEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  spaceEntityType,
} from '../../../../cf-entity-types';
import { createEntityRelationKey } from '../../../../entity-relations/entity-relations.types';
import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-organizations',
  templateUrl: './cloud-foundry-organizations.component.html',
  styleUrls: ['./cloud-foundry-organizations.component.scss'],
  providers: [
    CfOrgsListConfigService // TODO: RC only needed for demoing old way
  ]
})
export class CloudFoundryOrganizationsComponent {
  public canAddOrg$: Observable<boolean>;
  public listActionConfig: ListDefaultsActionOrConfig;
  public listConfig: Partial<IListConfig<APIResource<IOrganization>>>;
  public dataSourceConfig: Partial<IListDataSourceConfig<APIResource<IOrganization>, APIResource<IOrganization>>>;


  // TODO: RC Nuke all below to ctor (keep setup minimal contents)
  // TODO: RC Nuke CfOrgsListConfigService && CfOrgsDataSourceService
  private entityConfig = {
    entityType: organizationEntityType,
    endpointType: CF_ENDPOINT_TYPE
  };
  public catalogueEntity = entityCatalogue.getEntity(this.entityConfig);

  private createAction() {
    return CloudFoundryEndpointService.createGetAllOrganizations(this.cfEndpointService.cfGuid);
  }
  private setupWithAction(provider = false) {
    const action = this.createAction();
    if (provider) {
      const a = new ActionListConfigProvider<APIResource<IOrganization>>(this.store, action);
      this.listConfig = a.getListConfig();
    } else {
      this.listActionConfig = action;
    }
  }

  private setupWithEntityConfig(provider = false) {
    const endpointGuid = this.cfEndpointService.cfGuid;
    const action = CloudFoundryEndpointService.createGetAllOrganizations(endpointGuid);
    const a = {
      entityConfig: this.entityConfig,
      endpointGuid,
      paginationKey: action.paginationKey,
      extraArgs: {
        includeRelations: [
          createEntityRelationKey(organizationEntityType, spaceEntityType),
          createEntityRelationKey(organizationEntityType, domainEntityType),
          createEntityRelationKey(organizationEntityType, quotaDefinitionEntityType),
          createEntityRelationKey(organizationEntityType, privateDomainsEntityType),
          createEntityRelationKey(spaceEntityType, routeEntityType), // Not really needed at top level, but if we drop down into an org with
          // lots of spaces it saves spaces x routes requests
        ], populateMissing: false
      }
    };

    if (provider) {
      const b = new EntityConfigListConfigProvider<APIResource<IOrganization>>(this.store, a);
      this.listConfig = b.getListConfig();
    } else {
      this.listActionConfig = a;
    }
  }

  private setupWithListOverrides(provider = false) {
    const action = this.createAction();
    const ls: Partial<IListConfig<APIResource<IOrganization<unknown>>>> = {
      cardComponent: CfOrgCardComponent,
      viewType: ListViewTypes.BOTH,
      defaultView: 'cards' as ListView,
      getColumns: () => [{
        columnId: 'name',
        headerCell: () => 'Name',
        cellDefinition: {
          valuePath: 'entity.name',
          // getLink: (row: APIResource<IOrganization>) => `${row.metadata.guid}`
          getLink: (row: APIResource<IOrganization>) => `/cloud-foundry/${this.cfEndpointService.cfGuid}/organizations/${row.metadata.guid}`
        },
        sort: {
          type: 'sort',
          orderKey: 'name',
          field: 'entity.name'
        }
      }, {
        columnId: 'createdAt',
        headerCell: () => 'Creation',
        cellDefinition: {
          valuePath: 'metadata.created_at'
        },
        sort: {
          type: 'sort',
          orderKey: 'createdAt',
          field: 'metadata.created_at'
        },
      }],
      text: {
        title: 'CUSTOM TITLE (OR NONE)',
        filter: 'Search by nameaaa',
        noEntries: 'There are no organizations'
      }
    };
    if (provider) {
      const a = new ActionListConfigProvider<APIResource<IOrganization>>(this.store, action);
      a.updateListConfig(ls);
      this.listConfig = a.getListConfig();
    } else {
      this.listConfig = ls;
    }

  }

  private setupWithDataSourceOverrides(provider = false) {
    const action = this.createAction();
    const dsc: Partial<IListDataSourceConfig<APIResource<IOrganization>, APIResource<IOrganization>>> = {
      refresh: null,
      transformEntities: [
        { type: 'filter', field: 'entity.name' },
        (entities: any[], paginationState: PaginationEntityState) => {
          return entities;
          // return [entities[0], entities[1]];
        }]
    };
    if (provider) {
      const a = new ActionListConfigProvider<APIResource<IOrganization>>(this.store, action);
      a.updateDataSourceConfig(dsc);
      this.listConfig = a.getListConfig();
    } else {
      this.dataSourceConfig = dsc;
    }

  }

  private setupWithOriginalListConfig(provider = false) {
    this.listConfig = this.temp;
  }

  private setupWithMinimalListConfig(provider = false) {
    const action = this.createAction();
    const ls: Partial<IListConfig<APIResource<IOrganization<unknown>>>> = {
      cardComponent: CfOrgCardComponent,
      viewType: ListViewTypes.CARD_ONLY,
      defaultView: 'cards' as ListView,
      getColumns: () => [{
        columnId: 'name',
        headerCell: () => 'Name',
        sort: {
          type: 'sort',
          orderKey: 'name',
          field: 'entity.name'
        }
      }, {
        columnId: 'createdAt',
        headerCell: () => 'Creation',
        sort: {
          type: 'sort',
          orderKey: 'createdAt',
          field: 'metadata.created_at'
        },
      }],
      text: {
        title: null,
        filter: 'Search by name',
        noEntries: 'There are no organizations'
      }
    };
    const dsc: Partial<IListDataSourceConfig<APIResource<IOrganization>, APIResource<IOrganization>>> = {
      transformEntities: [{ type: 'filter', field: 'entity.name' }] // Note - this will go away once fixed in default case
    };

    if (provider) {
      const a = new ActionListConfigProvider<APIResource<IOrganization>>(this.store, action);
      a.updateListConfig(ls);
      a.updateDataSourceConfig(dsc);
      this.listConfig = a.getListConfig();
    } else {
      this.listActionConfig = action;
      this.listConfig = ls;
      this.dataSourceConfig = dsc;
    }
  }

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    currentUserPermissionsService: CurrentUserPermissionsService,
    private temp: CfOrgsListConfigService,
    private store: Store<any>,
  ) {
    this.canAddOrg$ = currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);

    // TODO: RC Nuke all below (keep setup minimal contents)
    // this.setupWithAction(true);
    // this.setupWithEntityConfig(true);
    // this.setupWithListOverrides(true);
    // this.setupWithDataSourceOverrides(true);
    // this.setupWithOriginalListConfig(true);// (ListService provider)
    this.setupWithMinimalListConfig(true); // (same as original but overrides instead of service)
  }
}


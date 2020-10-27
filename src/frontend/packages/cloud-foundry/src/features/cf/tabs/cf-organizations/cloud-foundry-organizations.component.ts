import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import {
  IListDataSourceConfig,
} from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-config';
import {
  ActionListConfigProvider,
} from '../../../../../../core/src/shared/components/list/list-generics/list-providers/action-list-config-provider';
import { IListConfig, ListViewTypes } from '../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IOrganization } from '../../../../cf-api.types';
import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-organizations',
  templateUrl: './cloud-foundry-organizations.component.html',
  styleUrls: ['./cloud-foundry-organizations.component.scss'],
})
export class CloudFoundryOrganizationsComponent {
  public canAddOrg$: Observable<boolean>;

  public provider: ActionListConfigProvider<APIResource<IOrganization>>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    currentUserPermissionsService: CurrentUserPermissionsService,
    private store: Store<any>,
  ) {
    this.canAddOrg$ = currentUserPermissionsService.can(CfCurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);

    this.provider = this.createProvider(this.cfEndpointService.cfGuid);
  }

  private createProvider(cfGuid: string): ActionListConfigProvider<APIResource<IOrganization>> {
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
      },
    };
    const dsc: Partial<IListDataSourceConfig<APIResource<IOrganization>, APIResource<IOrganization>>> = {
      transformEntities: [{ type: 'filter', field: 'entity.name' }] // Note - this will go away once fixed in default case
    };

    const action = CloudFoundryEndpointService.createGetAllOrganizations(cfGuid);
    const provider = new ActionListConfigProvider<APIResource<IOrganization>>(this.store, action);
    provider.updateListConfig(ls);
    provider.updateDataSourceConfig(dsc);

    return provider;
  }
}


import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import {
  CurrentUserPermissionsService,
  ActionListConfigProvider,
  ListViewTypes,
  ListViewComponent,
  PageSubNavComponent
} from '@stratosui/core';
import { ListView, APIResource } from '@stratosui/store';
import { IOrganization } from '../../../../cf-api.types';
import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-organizations',
  templateUrl: './cloud-foundry-organizations.component.html',
  styleUrls: ['./cloud-foundry-organizations.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageSubNavComponent,
    ListViewComponent
  ]
})
export class CloudFoundryOrganizationsComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private store = inject<Store<any>>(Store);

  public canAddOrg$: Observable<boolean>;

  public provider: ActionListConfigProvider<APIResource<IOrganization>>;

  constructor() {
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);

    this.canAddOrg$ = currentUserPermissionsService.can(CfCurrentUserPermissions.ORGANIZATION_CREATE, this.cfEndpointService.cfGuid);

    this.provider = this.createProvider(this.cfEndpointService.cfGuid);
  }

  private createProvider(cfGuid: string): ActionListConfigProvider<APIResource<IOrganization>> {
    const action = CloudFoundryEndpointService.createGetAllOrganizations(cfGuid);
    const provider = new ActionListConfigProvider<APIResource<IOrganization>>(this.store, action);

    provider.updateListConfig({
      cardComponent: CfOrgCardComponent,
      viewType: ListViewTypes.CARD_ONLY,
      defaultView: 'cards' as ListView,
      getColumns: () => [{
        columnId: 'name',
        headerCell: () => 'Name',
        sort: {
          type: 'natural-sort',
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
        filter: 'Filter by Name',
        noEntries: 'There are no organizations'
      },
    });

    provider.updateDataSourceConfig({
      transformEntities: [{ type: 'filter', field: 'entity.name' }] // Note - this will go away once fixed in default case
    });

    return provider;
  }
}


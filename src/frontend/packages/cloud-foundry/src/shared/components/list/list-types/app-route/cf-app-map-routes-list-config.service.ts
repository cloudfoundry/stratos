import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState, spaceEntityType, createEntityRelationPaginationKey, cfEntityCatalog } from '@stratosui/cloud-foundry';
import { CurrentUserPermissionsService, ConfirmationDialogService, IListConfig } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { TableCellRadioComponent } from '../../../../../../../core/src/shared/components/list/list-table/table-cell-radio/table-cell-radio.component';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppRoutesListConfigServiceBase } from './cf-app-routes-list-config-base';

@Injectable({
  providedIn: 'root'
})
export class CfAppMapRoutesListConfigService extends CfAppRoutesListConfigServiceBase implements IListConfig<APIResource> {

  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService,
    datePipe: DatePipe,
    activatedRoute: ActivatedRoute,
    currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    const spaceGuid = activatedRoute.snapshot.queryParamMap.get('spaceGuid');
    const action = cfEntityCatalog.route.actions.getAllInSpace(
      spaceGuid,
      appService.cfGuid,
      createEntityRelationPaginationKey(spaceEntityType, spaceGuid)
    );
    // If parentEntitySchema is set the entity validation process will look for the space routes in the parent space entity
    // In this case, we do have them however they're missing the route-->app relationship.. which means we fetch them at a rate of one per
    // route. For spaces with hundreds of routes this isn't acceptable, so remove the link to the parent and fetch the list afresh.
    action.parentEntityConfig = null;
    super(store, appService, confirmDialog, datePipe, currentUserPermissionsService, action, false);

    this.setupList(appService);
  }

  private setupList(appService: ApplicationService) {
    this.text = {
      title: 'Available Routes',
      noEntries: 'There are no routes'
    };
    // Add the 'radio' button column that will pick the single route to map
    this.getColumns().splice(0, 0, {
      columnId: 'radio',
      cellComponent: TableCellRadioComponent,
      cellConfig: {
        isDisabled: (row: APIResource): boolean => row && row.entity && row.entity.apps && row.entity.apps.find(
          (a: APIResource) => a.metadata.guid === appService.appGuid
        )
      },
      class: 'table-column-select',
      cellFlex: '0 0 60px'
    });
    // Standard check box selection should be disabled
    this.allowSelection = false;
    // Add the column displaying the attached app count.. or `Already attached` message
    this.getColumns().splice(this.getColumns().length - 1, 0, {
      columnId: 'attachedApps',
      headerCell: () => 'Apps Attached',
      cellDefinition: {
        valuePath: 'entity.mappedAppsCountLabel'
      },
      sort: {
        type: 'sort',
        orderKey: 'attachedApps',
        field: 'entity.mappedAppsCount'
      },
      cellFlex: '3'
    });
  }
}

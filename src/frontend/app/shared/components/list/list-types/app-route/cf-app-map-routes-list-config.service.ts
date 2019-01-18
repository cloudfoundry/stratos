import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { GetSpaceRoutes } from '../../../../../store/actions/space.actions';
import { AppState } from '../../../../../store/app-state';
import { spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { TableCellRadioComponent } from '../../list-table/table-cell-radio/table-cell-radio.component';
import { IListConfig } from '../../list.component.types';
import { CfAppRoutesListConfigServiceBase } from './cf-app-routes-list-config-base';

@Injectable()
export class CfAppMapRoutesListConfigService extends CfAppRoutesListConfigServiceBase implements IListConfig<APIResource> {

  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService,
    datePipe: DatePipe,
    activatedRoute: ActivatedRoute,
    currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    const spaceGuid = activatedRoute.snapshot.queryParamMap.get('spaceGuid');
    const action = new GetSpaceRoutes(spaceGuid, appService.cfGuid, createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid));
    // If parentEntitySchema is set the entity validation process will look for the space routes in the parent space entity
    // In this case, we do have them however they're missing the route-->app relationship.. which means we fetch them at a rate of one per
    // route. For spaces with hundreds of routes this isn't acceptable, so remove the link to the parent and fetch the list afresh.
    action.parentEntitySchema = null;
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
        isDisabled: (row): boolean => row && row.entity && row.entity.apps && row.entity.apps.find(
          a => a.metadata.guid === appService.appGuid
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

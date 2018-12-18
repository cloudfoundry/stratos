import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { GetSpaceRoutes } from '../../../../../store/actions/space.actions';
import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  domainSchemaKey,
  routeSchemaKey,
  spaceSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { TableCellRadioComponent } from '../../list-table/table-cell-radio/table-cell-radio.component';
import { IListConfig } from '../../list.component.types';
import { CfAppRoutesListConfigServiceBase } from './cf-app-routes-list-config-base';

@Injectable()
export class CfAppMapRoutesListConfigService extends CfAppRoutesListConfigServiceBase implements IListConfig<APIResource> {

  // TODO: RC fix - refresh on create route.... go to map existing... makes request per route
  constructor(
    store: Store<AppState>,
    appService: ApplicationService,
    confirmDialog: ConfirmationDialogService,
    datePipe: DatePipe,
    activatedRoute: ActivatedRoute,
    currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    const spaceGuid = activatedRoute.snapshot.queryParamMap.get('spaceGuid');
    const action = new GetSpaceRoutes(spaceGuid, appService.cfGuid, createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid), [
      createEntityRelationKey(routeSchemaKey, domainSchemaKey),
      createEntityRelationKey(routeSchemaKey, applicationSchemaKey)
    ]);
    super(store, appService, confirmDialog, datePipe, currentUserPermissionsService, action, false);
    this.text = {
      title: 'Available Routes',
      noEntries: 'There are no routes'
    };
    // Add the 'radio' button column that will pick the single route to map
    this.getColumns().splice(0, 0, {
      columnId: 'radio',
      headerCell: () => '',
      cellComponent: TableCellRadioComponent,
      cellConfig: {
        isDisabled: (row): boolean => {
          return row && row.entity && row.entity.apps && row.entity.apps.find(
            a => a.metadata.guid === appService.appGuid
          );
        }
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

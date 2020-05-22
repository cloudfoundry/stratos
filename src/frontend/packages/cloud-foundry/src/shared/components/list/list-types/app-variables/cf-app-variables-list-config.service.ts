import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { of as observableOf, Subject } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { ConfirmationDialogConfig } from '../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import {
  TableCellEditComponent,
} from '../../../../../../../core/src/shared/components/list/list-table/table-cell-edit/table-cell-edit.component';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListAction,
  IListConfig,
  IMultiListAction,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { UpdateExistingApplication } from '../../../../../actions/application.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { applicationEntityType } from '../../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfAppVariablesDataSource, ListAppEnvVar } from './cf-app-variables-data-source';
import { TableCellEditVariableComponent } from './table-cell-edit-variable/table-cell-edit-variable.component';


@Injectable()
export class CfAppVariablesListConfigService implements IListConfig<ListAppEnvVar> {
  envVarsDataSource: CfAppVariablesDataSource;

  private multiListActionDelete: IMultiListAction<ListAppEnvVar> = {
    action: (items: ListAppEnvVar[]) => {
      return this.dispatchDeleteAction(Array.from(this.envVarsDataSource.selectedRows.values()));
    },
    icon: 'delete',
    label: 'Delete',
    description: ''
  };

  private listActionDelete: IListAction<ListAppEnvVar> = {
    action: (item: ListAppEnvVar) => {
      return this.dispatchDeleteAction([item]);
    },
    label: 'Delete',
    description: '',
    createVisible: () => observableOf(true),
    createEnabled: () => observableOf(true)
  };

  columns: Array<ITableColumn<ListAppEnvVar>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'name'
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      }, cellFlex: '5'
    },
    {
      columnId: 'value',
      headerCell: () => 'Value',
      cellComponent: TableCellEditVariableComponent,
      class: 'app-table__cell--table-column-clip',
      sort: {
        type: 'sort',
        orderKey: 'value',
        field: 'value'
      }, cellFlex: '10'
    },
    {
      columnId: 'edit', headerCell: () => '',
      cellComponent: TableCellEditComponent,
      class: 'app-table__cell--table-column-edit',
      cellFlex: '2'
    },
  ];

  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Environment Variables', filter: 'Search by name', noEntries: 'There are no variables'
  };
  enableTextFilter = true;
  minRowHeight = '77px';

  private dispatchDeleteAction(newValues: ListAppEnvVar[]) {
    const confirmation = this.getConfirmationModal(newValues);

    const entityReq$ = this.getEntityMonitor();
    const trigger$ = new Subject();
    this.confirmDialog.open(
      confirmation,
      () => {
        cfEntityCatalog.appEnvVar.api.removeFromApplication(
          this.envVarsDataSource.appGuid,
          this.envVarsDataSource.cfGuid,
          this.envVarsDataSource.transformedEntities,
          newValues
        );
        trigger$.next();
      }
    );
    return trigger$.pipe(
      first(),
      switchMap(() => entityReq$)
    );
  }

  private getEntityMonitor() {
    const catalogEntity = entityCatalog.getEntity({
      entityType: applicationEntityType,
      endpointType: CF_ENDPOINT_TYPE
    });
    return catalogEntity
      .store
      .getEntityMonitor(
        this.envVarsDataSource.appGuid
      )
      .entityRequest$.pipe(
        map(request => request.updating[UpdateExistingApplication.updateKey]),
        filter(req => !!req)
      );
  }

  private getConfirmationModal(newValues: ListAppEnvVar[]) {
    const singleEnvVar = newValues.length === 1;
    return new ConfirmationDialogConfig(
      singleEnvVar ? `Delete Environment Variable?` : `Delete Environment Variables?`,
      singleEnvVar ?
        `Are you sure you want to delete '${newValues[0].name}'?` :
        `Are you sure you want to delete ${newValues.length} environment variables?`,
      'Delete',
      true
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => [this.multiListActionDelete];
  getSingleActions = () => [this.listActionDelete];
  getColumns = () => this.columns;
  getDataSource = () => this.envVarsDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<CFAppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.envVarsDataSource = new CfAppVariablesDataSource(this.store, this.appService, this);
  }

}

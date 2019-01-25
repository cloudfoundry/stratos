import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { of as observableOf, Subject } from 'rxjs';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppVariablesDelete } from '../../../../../store/actions/app-variables.actions';
import { AppState } from '../../../../../store/app-state';
import { TableCellEditComponent } from '../../list-table/table-cell-edit/table-cell-edit.component';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { CfAppVariablesDataSource, ListAppEnvVar } from './cf-app-variables-data-source';
import { TableCellEditVariableComponent } from './table-cell-edit-variable/table-cell-edit-variable.component';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { EntityMonitor } from '../../../../monitors/entity-monitor';
import { applicationSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { map, tap, filter, switchMap, first } from 'rxjs/operators';
import { UpdateExistingApplication } from '../../../../../store/actions/application.actions';

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
        getValue: (row) => `${row.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      }, cellFlex: '5'
    },
    {
      columnId: 'value', headerCell: () => 'Value', cellComponent: TableCellEditVariableComponent, sort: {
        type: 'sort',
        orderKey: 'value',
        field: 'value'
      }, cellFlex: '10'
    },
    {
      columnId: 'edit', headerCell: () => '', cellComponent: TableCellEditComponent, class: 'app-table__cell--table-column-edit',
      cellFlex: '2'
    },
  ];

  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Environment Variables', filter: 'Search by name', noEntries: 'There are no variables'
  };
  enableTextFilter = true;

  private dispatchDeleteAction(newValues: ListAppEnvVar[]) {
    const confirmation = this.getConfirmationModal(newValues);
    const action = new AppVariablesDelete(
      this.envVarsDataSource.cfGuid,
      this.envVarsDataSource.appGuid,
      this.envVarsDataSource.transformedEntities,
      newValues);

    const entityReq$ = this.getEntityMonitor();
    const trigger$ = new Subject();
    this.confirmDialog.open(
      confirmation,
      () => {
        this.store.dispatch(action);
        trigger$.next();
      }
    );
    return trigger$.pipe(
      first(),
      switchMap(() => entityReq$)
    );
  }

  private getEntityMonitor() {
    return new EntityMonitor(
      this.store,
      this.envVarsDataSource.appGuid,
      applicationSchemaKey,
      entityFactory(applicationSchemaKey)
    ).entityRequest$.pipe(
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
    private store: Store<AppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService
  ) {
    this.envVarsDataSource = new CfAppVariablesDataSource(this.store, this.appService, this);
  }

}

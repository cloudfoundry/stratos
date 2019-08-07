import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { of as observableOf, Subject } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { AppVariablesDelete } from '../../../../../../../store/src/actions/app-variables.actions';
import { UpdateExistingApplication } from '../../../../../../../store/src/actions/application.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { applicationSchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { EntityMonitor } from '../../../../monitors/entity-monitor';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { TableCellEditComponent } from '../../list-table/table-cell-edit/table-cell-edit.component';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
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
  getFilters = () => [];
  setFilter = (id: string) => null;

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private confirmDialog: ConfirmationDialogService
  ) {
    this.envVarsDataSource = new CfAppVariablesDataSource(this.store, this.appService, this);
  }

}

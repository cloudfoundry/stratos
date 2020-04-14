import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable, of, Subject } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { ITableListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { BackupConnectionCellComponent } from '../backup-connection-cell/backup-connection-cell.component';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupRestoreCellComponent } from '../backup-restore-cell/backup-restore-cell.component';
import { BackupEndpointTypes } from '../backup-restore-endpoints.service';

@Component({
  selector: 'app-backup-endpoints',
  templateUrl: './backup-endpoints.component.html',
  styleUrls: ['./backup-endpoints.component.scss'],
  providers: [
    BackupEndpointsService
  ]
})
export class BackupEndpointsComponent implements OnInit {

  // Step 1
  columns: ITableColumn<EndpointModel>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'name'
      }
    },
    {
      columnId: 'type',
      headerCell: () => 'Type',
      cellDefinition: {
        getValue: this.getEndpointTypeString
      },
    },
    {
      columnId: 'endpoint',
      headerCell: () => 'Backup',
      cellComponent: BackupRestoreCellComponent,
      cellConfig: {
        type: BackupEndpointTypes.ENDPOINT
      }
    },
    {
      columnId: 'connect',
      headerCell: () => 'Connection Details',
      cellComponent: BackupConnectionCellComponent,
    },
  ];
  endpointDataSource: ITableListDataSource<EndpointModel>;
  disableSelectAll$: Observable<boolean>;
  disableSelectNone$: Observable<boolean>;
  selectValid$: Observable<boolean>;

  // Step 2
  passwordValid$: Observable<boolean>;
  passwordForm: FormGroup;
  show = false;

  constructor(
    public service: BackupEndpointsService,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.setupSelectStep();
    this.setupPasswordStep();
  }


  setupSelectStep() {
    const action = new GetAllEndpoints();
    const endpointObs = getPaginationObservables<EndpointModel>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        action,
        true
      )
    }, true);


    const endpoints$ = endpointObs.entities$.pipe(
      filter(entities => !!entities),
      map(endpoints => endpoints.sort((a, b) => a.name.localeCompare(b.name)))
    );

    endpoints$.pipe(first()).subscribe(entities => this.service.initialize(entities));

    this.endpointDataSource = {
      isTableLoading$: endpointObs.fetchingEntities$,
      connect: () => endpoints$,
      disconnect: () => { },
      trackBy: (index, row) => row.guid
    };

    this.disableSelectAll$ = this.service.allChanged$;
    this.disableSelectNone$ = this.service.hasChanges$.pipe(
      map(hasChanges => !hasChanges)
    );

    this.selectValid$ = this.service.hasChanges$;
  }

  setupPasswordStep() {
    this.passwordForm = new FormGroup({
      password: new FormControl('', [Validators.required]),
    });
    this.passwordValid$ = this.passwordForm.statusChanges.pipe(
      map(() => {
        this.service.password = this.passwordForm.controls.password.value;
        return this.passwordForm.valid;
      })
    );
  }

  ngOnInit() {
  }

  onNext: StepOnNextFunction = () => {
    // TODO: RC Complete/Finish token warning
    const confirmation = new ConfirmationDialogConfig(
      'Backup',
      'Backing up connection details ?????????',
      'Continue',
      true
    );
    const result = new Subject<StepOnNextResult>();

    const userCancelledDialog = () => {
      result.next({
        success: false
      });
    };

    const backupSuccess = data => {
      result.next({
        success: true,
        redirect: true,
      });

      const downloadURL = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadURL;
      const dateTime = moment().format('YYYYMMDD-HHmmss'); // TODO: RC timezone?
      link.download = `stratos_backup_${dateTime}.bk`;
      link.click();
    };

    const backupFailure = err => {
      const errorMessage = this.service.createError(err);
      result.next({
        success: false,
        message: `Failed to create backup` + (errorMessage ? `: ${errorMessage}` : '')
      });
      return of(false);
    };

    const createBackup = () => this.service.createBackup().pipe(first()).subscribe(backupSuccess, backupFailure);

    // TODO: RC tie in progress indicator (not sure if possible)
    this.confirmDialog.openWithCancel(confirmation, createBackup, userCancelledDialog);

    // TODO: RC Remove console.log
    return result.asObservable().pipe(tap(console.log));
  }


  private getEndpointTypeString(endpoint: EndpointModel): string {
    return entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition.label;
  }
}

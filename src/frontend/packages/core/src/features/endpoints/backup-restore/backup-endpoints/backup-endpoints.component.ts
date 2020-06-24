import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { Observable, of, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { httpErrorResponseToSafeString } from '../../../../../../store/src/jetstream';
import { stratosEntityCatalog } from '../../../../../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { ITableListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { BackupCheckboxCellComponent } from '../backup-checkbox-cell/backup-checkbox-cell.component';
import { BackupConnectionCellComponent } from '../backup-connection-cell/backup-connection-cell.component';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupEndpointTypes } from '../backup-restore.types';

@Component({
  selector: 'app-backup-endpoints',
  templateUrl: './backup-endpoints.component.html',
  styleUrls: ['./backup-endpoints.component.scss'],
  providers: [
    BackupEndpointsService
  ]
})
export class BackupEndpointsComponent {

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
      cellComponent: BackupCheckboxCellComponent,
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
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.setupSelectStep();
    this.setupPasswordStep();
  }


  setupSelectStep() {
    const endpointObs = stratosEntityCatalog.endpoint.store.getAll.getPaginationService();

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
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
    this.passwordValid$ = this.passwordForm.statusChanges.pipe(
      map(() => {
        this.service.password = this.passwordForm.controls.password.value;
        return this.passwordForm.valid;
      })
    );
  }

  onNext: StepOnNextFunction = () => {
    const confirmation = new ConfirmationDialogConfig(
      'Backup',
      'The backup that is about to be created may contain credentials, tokens and other sensitive information. Although it is encrypted, you should take the appropriate steps to secure it. ',
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
      const downloadURL = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadURL;
      // Time of client, not server
      const dateTime = moment().format('YYYYMMDD-HHmmss');
      link.download = `stratos_backup_${dateTime}.bk`;
      link.click();

      result.next({
        success: true,
        redirect: true,
      });
    };

    const backupFailure = err => {
      const errorMessage = httpErrorResponseToSafeString(err);
      result.next({
        success: false,
        message: `Failed to create backup` + (errorMessage ? `: ${errorMessage}` : '')
      });
      return of(false);
    };

    const createBackup = () => this.service.createBackup().pipe(first()).subscribe(backupSuccess, backupFailure);

    if (this.service.hasConnectionDetails()) {
      this.confirmDialog.openWithCancel(confirmation, createBackup, userCancelledDialog);
    } else {
      createBackup();
    }

    return result.asObservable();
  }


  private getEndpointTypeString(endpoint: EndpointModel): string {
    return entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition.label;
  }
}

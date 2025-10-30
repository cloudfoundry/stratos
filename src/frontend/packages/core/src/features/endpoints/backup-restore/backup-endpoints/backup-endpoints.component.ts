import { CommonModule } from '@angular/common';
import { Component, OnDestroy, Injector } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import moment from 'moment';
import { httpErrorResponseToSafeString, entityCatalog, stratosEntityCatalog, EndpointModel } from '@stratosui/store';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { safeUnsubscribe } from '../../../../core/utils.service';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { ITableListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { TableComponent } from '../../../../shared/components/list/list-table/table.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StepComponent } from '../../../../shared/components/stepper/step/step.component';
import { StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../shared/components/stepper/steppers/steppers.component';
import { ShowHideButtonComponent } from '../../../../core/show-hide-button/show-hide-button.component';
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
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    TableComponent,
    ShowHideButtonComponent
  ]
})
export class BackupEndpointsComponent implements OnDestroy {

  sub: Subscription;

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
  passwordForm: UntypedFormGroup;
  showPassword: boolean[] = [];

  constructor(
    public service: BackupEndpointsService,
    private confirmDialog: ConfirmationDialogService,
    private injector: Injector,
  ) {
    this.setupSelectStep();
    this.setupPasswordStep();
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.sub);
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
      trackBy: (index: number, row: EndpointModel) => row.guid
    };

    this.disableSelectAll$ = toObservable(this.service.allChanged, { injector: this.injector });
    this.disableSelectNone$ = toObservable(this.service.hasChanges, { injector: this.injector }).pipe(
      map(hasChanges => !hasChanges)
    );

    this.selectValid$ = toObservable(this.service.hasChanges, { injector: this.injector });
  }

  setupPasswordStep() {
    this.passwordForm = new UntypedFormGroup({
      password: new UntypedFormControl('', [Validators.required, Validators.minLength(6)]),
      password2: new UntypedFormControl(''),
    });
    this.sub = this.passwordForm.controls.password.valueChanges.subscribe(value => this.passwordForm.controls.password2.setValidators(
      [Validators.required, Validators.pattern(value)]
    ));
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

    const backupSuccess = (data: Blob) => {
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

    const backupFailure = (err: any) => {
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
  };


  private getEndpointTypeString(endpoint: EndpointModel): string {
    return entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition.label;
  }
}

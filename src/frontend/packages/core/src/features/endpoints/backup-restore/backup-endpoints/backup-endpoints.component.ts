import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, Validators, FormControl, FormGroup, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { format } from 'date-fns';
import { httpErrorResponseToSafeString, entityCatalog, EndpointModel, EndpointsDataService } from '@stratosui/store';
import { Observable, Subscription } from 'rxjs';
import { take, defaultIfEmpty, filter, map } from 'rxjs/operators';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { safeUnsubscribe } from '../../../../core/utils.service';
import { naturalCompare } from '../../../../shared/utils/natural-sort';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { ITableListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../shared/components/list/list-table/table.types';
import { TableComponent } from '../../../../shared/components/list/list-table/table.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StepComponent, SignalStepHandle } from '../../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../shared/components/stepper/steppers/steppers.component';
import { ShowHideButtonComponent } from '../../../../core/show-hide-button/show-hide-button.component';
import { BackupCheckboxCellComponent } from '../backup-checkbox-cell/backup-checkbox-cell.component';
import { BackupConnectionCellComponent } from '../backup-connection-cell/backup-connection-cell.component';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupEndpointTypes } from '../backup-restore.types';

// Typed form interface for password form
interface BackupPasswordForm {
  password: FormControl<string>;
  password2: FormControl<string>;
}

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackupEndpointsComponent implements OnDestroy {
  service = inject(BackupEndpointsService);
  private confirmDialog = inject(ConfirmationDialogService);
  private endpointsData = inject(EndpointsDataService);
  private injector = inject(Injector);
  private router = inject(Router);


  sub!: Subscription;

  // Signal-handles for the two stepper steps (FWT-957)
  selectStepHandle!: SignalStepHandle;
  passwordStepHandle!: SignalStepHandle;

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
      } },
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
      cellComponent: BackupConnectionCellComponent },
  ];
  endpointDataSource!: ITableListDataSource<EndpointModel>;
  disableSelectAll$!: Observable<boolean>;
  disableSelectNone$!: Observable<boolean>;
  selectValid$!: Observable<boolean>;

  // Step 2
  passwordValid$!: Observable<boolean>;
  passwordForm!: FormGroup<BackupPasswordForm>;
  showPassword: boolean[] = [];

  // Custom validator for password matching
  private readonly passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup<BackupPasswordForm>;
    const password = group.controls.password.value;
    const password2 = group.controls.password2.value;
    return password === password2 ? null : { passwordMismatch: true };
  };

  constructor() {
    this.setupSelectStep();
    this.setupPasswordStep();
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.sub);
  }

  setupSelectStep() {
    // W36-B Wave 3: source endpoints from EndpointsDataService signal
    // bridge instead of the legacy ngrx PaginationService. The
    // service's `endpointsList` signal is populated via /pp/v1/info,
    // same data; loading state comes from `loading()`.
    const endpoints$ = toObservable(this.endpointsData.endpointsList, { injector: this.injector }).pipe(
      filter(entities => !!entities),
      map(endpoints => [...endpoints].sort((a, b) => naturalCompare(a.name, b.name)))
    );
    const fetching$ = toObservable(this.endpointsData.loading, { injector: this.injector });

    endpoints$.pipe(take(1), defaultIfEmpty([] as EndpointModel[])).subscribe(entities => this.service.initialize(entities));

    this.endpointDataSource = {
      isTableLoading$: fetching$,
      connect: () => endpoints$,
      disconnect: () => { },
      trackBy: (index: number, row: EndpointModel) => row.guid
    };

    this.disableSelectAll$ = toObservable(this.service.allChanged, { injector: this.injector });
    this.disableSelectNone$ = toObservable(this.service.hasChanges, { injector: this.injector }).pipe(
      map(hasChanges => !hasChanges)
    );

    this.selectValid$ = toObservable(this.service.hasChanges, { injector: this.injector });

    this.selectStepHandle = {
      valid: this.service.hasChanges,
    };
  }

  setupPasswordStep() {
    this.passwordForm = new FormGroup<BackupPasswordForm>(
      {
        password: new FormControl('', {
          validators: [Validators.required, Validators.minLength(6)],
          nonNullable: true
        }),
        password2: new FormControl('', {
          validators: [Validators.required],
          nonNullable: true
        }) },
      { validators: this.passwordMatchValidator }
    );

    this.passwordValid$ = this.passwordForm.statusChanges.pipe(
      map(() => {
        this.service.password = this.passwordForm.controls.password.value;
        return this.passwordForm.valid;
      })
    );

    const passwordValidSignal = toSignal(this.passwordValid$, { initialValue: this.passwordForm.valid });
    this.passwordStepHandle = {
      valid: passwordValidSignal,
      submit: () => this.runBackup(),
    };
  }

  private runBackup(): Promise<void> {
    const confirmation = new ConfirmationDialogConfig(
      'Backup',
      'The backup that is about to be created may contain credentials, tokens and other sensitive information. Although it is encrypted, you should take the appropriate steps to secure it. ',
      'Continue',
      true
    );

    return new Promise<void>((resolve, reject) => {
      const userCancelledDialog = () => {
        // Match legacy behavior: cancel returned `success: false` with no
        // message, leaving the user on the password step. Reject with an
        // empty message so the stepper snackbar stays quiet.
        reject(new Error(''));
      };

      const backupSuccess = (data: Blob) => {
        const downloadURL = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = downloadURL;
        // Time of client, not server
        const dateTime = format(new Date(), 'yyyyMMdd-HHmmss');
        link.download = `stratos_backup_${dateTime}.bk`;
        link.click();

        // Replace legacy `redirect: true` with explicit navigation back to
        // the endpoints page (matches the stepper cancel target).
        this.router.navigate(['/endpoints']).then(() => resolve());
      };

      const backupFailure = (err: any) => {
        const errorMessage = httpErrorResponseToSafeString(err);
        reject(new Error(`Failed to create backup` + (errorMessage ? `: ${errorMessage}` : '')));
      };

      const createBackup = () => this.service.createBackup().pipe(take(1), defaultIfEmpty(null)).subscribe(
        res => res !== null ? backupSuccess(res) : backupFailure('Backup service returned no response'),
        backupFailure
      );

      if (this.service.hasConnectionDetails()) {
        this.confirmDialog.openWithCancel(confirmation, createBackup, userCancelledDialog);
      } else {
        createBackup();
      }
    });
  }


  private getEndpointTypeString(endpoint: EndpointModel): string {
    return entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition.label;
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, Injector, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
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
import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
} from '../../../../shared/components/signal-list/signal-list.component';
import { SignalListCellTemplateDirective } from '../../../../shared/components/signal-list/signal-list-cell-template.directive';
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
    SignalListComponent,
    SignalListCellTemplateDirective,
    BackupCheckboxCellComponent,
    BackupConnectionCellComponent,
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

  // Static config for the Backup checkbox column's projected cell.
  readonly endpointCheckboxConfig = { type: BackupEndpointTypes.ENDPOINT };

  // Step 1 — signal-list state
  readonly pageSize: WritableSignal<number> = signal(100);
  readonly pageIndex: WritableSignal<number> = signal(0);
  // Bumped after Select All/None so the in-memory `service.state` mutation
  // (a plain object — not signal-tracked) forces the endpoints signal to a
  // fresh array reference and re-renders the projected OnPush cells. Per-row
  // checkbox/select edits don't need this: they fire events in their own view.
  private readonly refreshTick: WritableSignal<number> = signal(0);

  private readonly endpoints: Signal<EndpointModel[]> = computed(() => {
    this.refreshTick();
    const list = this.endpointsData.endpointsList();
    return list ? [...list].sort((a, b) => naturalCompare(a.name, b.name)) : [];
  });
  private readonly loading: Signal<boolean> = toSignal(
    toObservable(this.endpointsData.loading, { injector: this.injector }),
    { initialValue: false },
  );

  private readonly pagedItems: Signal<EndpointModel[]> = computed(() => {
    const size = this.pageSize();
    const idx = this.pageIndex();
    return this.endpoints().slice(idx * size, idx * size + size);
  });
  private readonly totalFilteredResults: Signal<number> = computed(() => this.endpoints().length);
  private readonly totalPages: Signal<number> = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.max(1, Math.ceil(this.totalFilteredResults() / size)) : 1;
  });

  listConfig!: SignalListConfig<EndpointModel>;

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

    endpoints$.pipe(take(1), defaultIfEmpty([] as EndpointModel[])).subscribe(entities => this.service.initialize(entities));

    this.listConfig = {
      pagedItems: this.pagedItems,
      totalFilteredResults: this.totalFilteredResults,
      totalPages: this.totalPages,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      pageSizeOptions: [25, 50, 100],
      hidePagerWhenSingle: true,
      isAnyLoading: this.loading,
      errorsByCnsi: signal(new Map()),
      // strict: registered endpoints always carry a guid (the row identity)
      getRowKey: (row: EndpointModel) => row.guid!,
      columns: this.buildColumns(),
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

  private buildColumns(): SignalListColumn<EndpointModel>[] {
    return [
      {
        header: 'Name', key: 'name', kind: 'text',
        render: (row: EndpointModel) => row.name,
      },
      {
        header: 'Type', key: 'type', kind: 'text',
        render: (row: EndpointModel) => this.getEndpointTypeString(row),
      },
      {
        header: 'Backup', key: 'endpoint', kind: 'template',
        templateName: 'endpoint',
        render: () => '',
      },
      {
        header: 'Connection Details', key: 'connect', kind: 'template',
        templateName: 'connect',
        render: () => '',
      },
    ];
  }

  // Mutates the shared service state then forces a row re-render — see
  // refreshTick. Keeps the visible checkboxes/selects in sync with the
  // programmatic Select All / Select None.
  selectAll(): void {
    this.service.selectAll();
    this.refreshTick.update(v => v + 1);
  }

  selectNone(): void {
    this.service.selectNone();
    this.refreshTick.update(v => v + 1);
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
    if (!endpoint.cnsi_type) {
      return '';
    }
    return entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition.label ?? endpoint.cnsi_type;
  }
}

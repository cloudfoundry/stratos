import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TailwindSnackBarService, TailwindSnackBarRef } from '@stratosui/core';
import { TailwindErrorStateMatcher, TailwindShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import { AutoscalerCredentialDataService } from '../../services/domain-data/autoscaler-credential-data.service';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { AppAutoscalerCredential } from '../../store/app-autoscaler.types';

interface AutoscalerCredentialForm {
  actype: FormControl<boolean>;
  acusername: FormControl<string>;
  acpassword: FormControl<string>;
}

interface CredentialView extends AppAutoscalerCredential {
  authHeader: string;
  fullUrl: string;
}

@Component({
  selector: 'app-edit-autoscaler-credential',
  templateUrl: './edit-autoscaler-credential.component.html',
  styleUrls: ['./edit-autoscaler-credential.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TailwindErrorStateMatcher, useClass: TailwindShowOnDirtyErrorStateMatcher },
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PageHeaderComponent,
  ]
})
export class EditAutoscalerCredentialComponent implements OnInit, OnDestroy {
  applicationService = inject(ApplicationService);
  private fb = inject(FormBuilder);
  private credentialData = inject(AutoscalerCredentialDataService);
  private appAutoscalerCredentialSnackBar = inject(TailwindSnackBarService);
  private confirmDialog = inject(ConfirmationDialogService);
  private cdr = inject(ChangeDetectorRef);


  parentUrl: string;
  applicationName$!: Observable<string | null>;

  public editCredentialForm: FormGroup<AutoscalerCredentialForm>;

  // Signal-native data flow: createCredential() pushes a fresh value here on
  // success; the template binds via the async pipe just like the legacy
  // EntityServiceFactory observable did.
  private createdCredential = new BehaviorSubject<CredentialView | null>(null);
  public appAutoscalerCredential$: Observable<CredentialView | null> = this.createdCredential.asObservable();

  private appAutoscalerCredentialSnackBarRef!: TailwindSnackBarRef<any>;


  private creating = new BehaviorSubject(false);
  public creating$ = this.creating.asObservable();
  private deleting = new BehaviorSubject(false);
  public deleting$ = this.deleting.asObservable();

  constructor() {
    this.parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
    this.editCredentialForm = this.fb.group<AutoscalerCredentialForm>({
      actype: this.fb.nonNullable.control({ value: true, disabled: false }),
      acusername: this.fb.nonNullable.control({ value: '', disabled: true }, Validators.required),
      acpassword: this.fb.nonNullable.control({ value: '', disabled: true }, Validators.required) });
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.appAutoscalerCredentialSnackBarRef) {
      this.appAutoscalerCredentialSnackBarRef.dismiss();
    }
  }

  toggleChange() {
    if (this.editCredentialForm.controls.actype.value) {
      this.editCredentialForm.controls.acusername.setValue('');
      this.editCredentialForm.controls.acpassword.setValue('');
      this.editCredentialForm.controls.acusername.disable();
      this.editCredentialForm.controls.acpassword.disable();
    } else {
      this.editCredentialForm.controls.acusername.setValue('');
      this.editCredentialForm.controls.acpassword.setValue('');
      this.editCredentialForm.controls.acusername.enable();
      this.editCredentialForm.controls.acpassword.enable();
    }
  }

  async createCredential(): Promise<void> {
    this.creating.next(true);
    const cnsi = this.applicationService.cfGuid;
    const appGuid = this.applicationService.appGuid;
    const body: AppAutoscalerCredential | undefined = this.editCredentialForm.controls.actype.value
      ? undefined
      : {
        username: this.editCredentialForm.controls.acusername.value,
        password: this.editCredentialForm.controls.acpassword.value,
      };
    try {
      const creds = await this.credentialData.create(cnsi, appGuid, body);
      this.createdCredential.next({
        ...creds,
        authHeader: 'basic ' + btoa(`${creds.username}:${creds.password}`),
        fullUrl: `${creds.url}/v1/apps/${creds.app_id}/metrics`,
      });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? String(err);
      if (this.appAutoscalerCredentialSnackBarRef) {
        this.appAutoscalerCredentialSnackBarRef.dismiss();
      }
      this.appAutoscalerCredentialSnackBarRef =
        this.appAutoscalerCredentialSnackBar.open(`Failed to create credentials: ${message}`, 'Dismiss');
    } finally {
      this.creating.next(false);
      this.cdr.markForCheck();
    }
  }

  deleteCredentialConfirm() {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Credentials',
      'Are you sure you want to delete the credentials?',
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      void this.deleteCredential();
    });
  }

  async deleteCredential(): Promise<void> {
    this.deleting.next(true);
    const cnsi = this.applicationService.cfGuid;
    const appGuid = this.applicationService.appGuid;
    try {
      await this.credentialData.delete(cnsi, appGuid);
      // Successful delete invalidates any previously displayed creds.
      this.createdCredential.next(null);
    } catch (err) {
      const message = (err as { message?: string })?.message ?? String(err);
      if (this.appAutoscalerCredentialSnackBarRef) {
        this.appAutoscalerCredentialSnackBarRef.dismiss();
      }
      this.appAutoscalerCredentialSnackBarRef =
        this.appAutoscalerCredentialSnackBar.open(`Failed to delete credential: ${message}`, 'Dismiss');
    } finally {
      this.deleting.next(false);
      this.cdr.markForCheck();
    }
  }

}

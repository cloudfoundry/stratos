import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { delay, filter, first, map, pairwise, publishReplay, refCount, tap } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { safeUnsubscribe } from '../../../../core/src/core/utils.service';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { AppState } from '../../../../store/src/app-state';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { EntityService } from '../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { selectDeletionInfo } from '../../../../store/src/selectors/api.selectors';
import {
  DeleteAppAutoscalerCredentialAction,
  UpdateAppAutoscalerCredentialAction,
} from '../../store/app-autoscaler.actions';
import { AppAutoscalerCredential } from '../../store/app-autoscaler.types';

@Component({
  selector: 'app-edit-autoscaler-credential',
  templateUrl: './edit-autoscaler-credential.component.html',
  styleUrls: ['./edit-autoscaler-credential.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
  ]
})
export class EditAutoscalerCredentialComponent implements OnInit, OnDestroy {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  applicationName$: Observable<string>;

  public editCredentialForm: FormGroup;
  public appAutoscalerCredential$: Observable<AppAutoscalerCredential>;

  private appAutoscalerCredentialErrorSub: Subscription;
  private appAutoscalerCredentialSnackBarRef: MatSnackBarRef<SimpleSnackBar>;


  private creating = new BehaviorSubject(false);
  public creating$ = this.creating.asObservable();
  private deleting = new BehaviorSubject(false);
  public deleting$ = this.deleting.asObservable();

  constructor(
    public applicationService: ApplicationService,
    private fb: FormBuilder,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private appAutoscalerCredentialSnackBar: MatSnackBar,
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.editCredentialForm = this.fb.group({
      actype: new FormControl({ value: true }),
      acusername: new FormControl({ value: '', disabled: true }, Validators.required),
      acpassword: new FormControl({ value: '', disabled: true }, Validators.required),
    });
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
  }

  ngOnDestroy(): void {
    if (this.appAutoscalerCredentialSnackBarRef) {
      this.appAutoscalerCredentialSnackBarRef.dismiss();
    }
    safeUnsubscribe(this.appAutoscalerCredentialErrorSub);
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

  createCredential() {
    this.creating.next(true);
    let action: UpdateAppAutoscalerCredentialAction;
    if (this.editCredentialForm.controls.actype.value) {
      action = new UpdateAppAutoscalerCredentialAction(this.applicationService.appGuid, this.applicationService.cfGuid);
    } else {
      const credential: AppAutoscalerCredential = {
        username: this.editCredentialForm.controls.acusername.value,
        password: this.editCredentialForm.controls.acpassword.value,
      };
      action = new UpdateAppAutoscalerCredentialAction(this.applicationService.appGuid, this.applicationService.cfGuid, credential);
    }
    const updateAppAutoscalerCredentialService: EntityService = this.entityServiceFactory.create(
      this.applicationService.appGuid,
      action,
    );
    this.appAutoscalerCredential$ = updateAppAutoscalerCredentialService.entityObs$.pipe(
      filter(({ entity, entityRequestInfo }) => {
        return entityRequestInfo && !entityRequestInfo.creating && !entityRequestInfo.deleting.busy;
      }),
      map(({ entity }) => entity ? entity.entity : null),
      map(creds => {
        if (!creds) {
          return;
        }
        return {
          ...creds,
          authHeader: 'basic ' + btoa(`${creds.username}:${creds.password}`),
          fullUrl: `${creds.url}/v1/apps/${creds.app_id}/metrics`
        }
      }),
      publishReplay(1),
      refCount()
    );
    updateAppAutoscalerCredentialService.entityMonitor.getUpdatingSection(action.updatingKey).pipe(
      delay(150),
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      first(),
    ).subscribe(actionState => {
      this.creating.next(false);
      if (actionState.error) {
        if (this.appAutoscalerCredentialSnackBarRef) {
          this.appAutoscalerCredentialSnackBarRef.dismiss();
        }
        this.appAutoscalerCredentialSnackBarRef =
          this.appAutoscalerCredentialSnackBar.open(`Failed to create credentials: ${actionState.message}`, 'Dismiss');
      }

    });
    this.store.dispatch(action);
  }

  deleteCredentialConfirm() {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Credentials',
      'Are you sure you want to delete the credentials?',
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      this.deleteCredential().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          if (this.appAutoscalerCredentialSnackBarRef) {
            this.appAutoscalerCredentialSnackBarRef.dismiss();
          }
          this.appAutoscalerCredentialSnackBarRef =
            this.appAutoscalerCredentialSnackBar.open(`Failed to delete credential: ${actionState.message}`, 'Dismiss');
        }
      });
    });
  }

  deleteCredential(): Observable<ActionState> {
    this.deleting.next(true);
    const action = new DeleteAppAutoscalerCredentialAction(this.applicationService.appGuid, this.applicationService.cfGuid);
    this.store.dispatch(action);
    const entityKey = entityCatalog.getEntityKey(action);

    return this.store.select(selectDeletionInfo(entityKey, this.applicationService.appGuid)).pipe(
      delay(250),
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      tap(() => this.deleting.next(false))
    );
  }

}

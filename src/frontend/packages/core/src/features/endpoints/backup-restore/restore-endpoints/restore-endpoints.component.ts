import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Store } from '@ngrx/store';
import { Observable, of, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../../store/src/actions/endpoint.actions';
import { GeneralEntityAppState } from '../../../../../../store/src/app-state';
import { getEventFiles } from '../../../../core/browser-helper';
import { httpErrorResponseToSafeString } from '../../../../jetstream.helpers';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { RestoreEndpointsService } from '../restore-endpoints.service';


@Component({
  selector: 'app-restore-endpoints',
  templateUrl: './restore-endpoints.component.html',
  styleUrls: ['./restore-endpoints.component.scss'],
  providers: [
    RestoreEndpointsService
  ]
})
export class RestoreEndpointsComponent {

  // Step 2
  passwordValid$: Observable<boolean>;
  passwordForm: FormGroup;
  show = false;

  constructor(
    private store: Store<GeneralEntityAppState>,
    public service: RestoreEndpointsService,
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.setupPasswordStep();
  }

  setupPasswordStep() {
    this.passwordForm = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
    this.passwordValid$ = this.passwordForm.statusChanges.pipe(
      map(() => {
        this.service.setPassword(this.passwordForm.controls.password.value);
        return this.passwordForm.valid;
      })
    );
  }

  onFileChange(event) {
    const files = getEventFiles(event);
    if (!files.length) {
      return;
    }
    const file = files[0];
    this.service.setFile(file);
  }

  onIgnoreDbChange(event: MatCheckboxChange) {
    this.service.setIgnoreDbVersion(event.checked);
  }

  restore: StepOnNextFunction = () => {
    const confirmation = new ConfirmationDialogConfig(
      'Restore',
      'This will overwrite any matching endpoints and connection details.',
      'Continue',
      true
    );
    const result = new Subject<StepOnNextResult>();

    const userCancelledDialog = () => {
      result.next({
        success: false
      });
    };

    const restoreSuccess = () => {
      this.store.dispatch(new GetAllEndpoints());
      result.next({
        success: true,
        redirect: true,
      });
    };

    const backupFailure = err => {
      const errorMessage = httpErrorResponseToSafeString(err);
      result.next({
        success: false,
        message: `Failed to restore backup` + (errorMessage ? `: ${errorMessage}` : '')
      });
      return of(false);
    };

    const restoreBackup = () => this.service.restoreBackup().pipe(first()).subscribe(restoreSuccess, backupFailure);

    this.confirmDialog.openWithCancel(confirmation, restoreBackup, userCancelledDialog);

    return result.asObservable();
  }

}

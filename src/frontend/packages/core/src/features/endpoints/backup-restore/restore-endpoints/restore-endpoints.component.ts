import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material';
import { Observable, of, Subject } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { getEventFiles } from '../../../../core/browser-helper';
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

  constructor(
    public service: RestoreEndpointsService,
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.setupPasswordStep();
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
      'This will overwrite any matching endpoints and connection details',
      'Continue',
      true
    );
    const result = new Subject<StepOnNextResult>();

    const userCancelledDialog = () => {
      result.next({
        success: false
      });
    };

    const restoreSuccess = data => {
      result.next({
        success: true,
        redirect: true,
      });
    };

    const backupFailure = err => {
      const errorMessage = this.service.createError(err);
      result.next({
        success: false,
        message: `Failed to restore backup` + (errorMessage ? `: ${errorMessage}` : '')
      });
      return of(false);
    };
    // TODO: RC make generic in base

    const createBackup = () => this.service.restoreBackup().pipe(first()).subscribe(restoreSuccess, backupFailure);

    // TODO: RC tie in progress indicator (not sure if possible)
    this.confirmDialog.openWithCancel(confirmation, createBackup, userCancelledDialog);

    // TODO: RC Remove console.log
    return result.asObservable().pipe(tap(console.log));
  }

}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, FormControl, FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { EndpointsDataService, httpErrorResponseToSafeString } from '@stratosui/store';
import { Observable } from 'rxjs';
import { take, defaultIfEmpty, map } from 'rxjs/operators';

import { getEventFiles } from '../../../../core/browser-helper';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { SignalStepHandle } from '../../../../shared/components/stepper/step/step.component';
import { RestoreEndpointsService } from '../restore-endpoints.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../../shared/components/stepper/step/step.component';
import { ShowHideButtonComponent } from '../../../../core/show-hide-button/show-hide-button.component';
import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';

@Component({
  selector: 'app-restore-endpoints',
  templateUrl: './restore-endpoints.component.html',
  styleUrls: ['./restore-endpoints.component.scss'],
  providers: [
    RestoreEndpointsService
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    ShowHideButtonComponent,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RestoreEndpointsComponent {
  service = inject(RestoreEndpointsService);
  private confirmDialog = inject(ConfirmationDialogService);
  private endpointsData = inject(EndpointsDataService);
  private router = inject(Router);


  // Step 2
  passwordValid$!: Observable<boolean>;
  passwordForm!: FormGroup;
  show = false;

  // Signal-handles (FWT-957)
  fileStepHandle: SignalStepHandle = {
    valid: this.service.validFileContent,
  };
  passwordStepHandle!: SignalStepHandle;

  constructor() {
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

    const passwordValidSignal = toSignal(this.passwordValid$, { initialValue: this.passwordForm.valid });
    this.passwordStepHandle = {
      valid: passwordValidSignal,
      submit: () => this.runRestore(),
    };
  }

  onFileChange(event: Event) {
    const files = getEventFiles(event);
    if (!files || !files.length) {
      return;
    }
    const file = files[0];
    this.service.setFile(file);
  }

  onIgnoreDbChange(event: MatCheckboxChange) {
    this.service.setIgnoreDbVersion(event.checked);
  }

  private runRestore(): Promise<void> {
    const confirmation = new ConfirmationDialogConfig(
      'Restore',
      'This will overwrite any matching endpoints and connection details.',
      'Continue',
      true
    );

    return new Promise<void>((resolve, reject) => {
      const userCancelledDialog = () => {
        // Match legacy `success: false` cancel behavior — silent.
        reject(new Error(''));
      };

      const restoreSuccess = () => {
        // W36-B Wave 3: refresh endpoints via EndpointsDataService so
        // the local signal map repopulates with the restored entries.
        void this.endpointsData.getAll(false).catch(() => {/* surfaced on service.error */});
        // Replace legacy `redirect: true` with explicit navigation back to
        // the endpoints page (matches the stepper cancel target).
        this.router.navigate(['/endpoints']).then(() => resolve());
      };

      const backupFailure = (err: any) => {
        const errorMessage = httpErrorResponseToSafeString(err);
        reject(new Error(`Failed to restore backup` + (errorMessage ? `: ${errorMessage}` : '')));
      };

      const restoreBackup = () => this.service.restoreBackup().pipe(take(1), defaultIfEmpty(null)).subscribe(
        res => res !== null ? restoreSuccess() : backupFailure('Restore service returned no response'),
        backupFailure
      );

      this.confirmDialog.openWithCancel(confirmation, restoreBackup, userCancelledDialog);
    });
  }

}

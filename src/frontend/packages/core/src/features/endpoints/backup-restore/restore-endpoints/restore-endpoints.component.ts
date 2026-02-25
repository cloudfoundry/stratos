import { ChangeDetectionStrategy, Component  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { Store } from '@ngrx/store';
import { stratosEntityCatalog, GeneralEntityAppState, httpErrorResponseToSafeString } from '@stratosui/store';
import { Observable, of, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { getEventFiles } from '../../../../core/browser-helper';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
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

  // Step 2
  passwordValid$!: Observable<boolean>;
  passwordForm!: FormGroup;
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

  onFileChange(event: Event) {
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
      stratosEntityCatalog.endpoint.api.getAll();
      result.next({
        success: true,
        redirect: true,
      });
    };

    const backupFailure = (err: any) => {
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
  };

}

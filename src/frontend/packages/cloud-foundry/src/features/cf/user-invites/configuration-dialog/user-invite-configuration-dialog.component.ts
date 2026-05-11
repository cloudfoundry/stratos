import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { take } from 'rxjs/operators';

import { AppProgressBarComponent } from '@stratosui/core';
import { TailwindSnackBarService } from '@stratosui/core';
import { TailwindDialogRef } from '@stratosui/core';
import { DialogErrorComponent } from '@stratosui/core';
import { MAT_DIALOG_DATA } from '@stratosui/core';

import { UserInviteConfigureService } from '../user-invite.service';

interface UserInviteConfigForm {
  clientID: FormControl<string>;
  clientSecret: FormControl<string>;
}

@Component({
  selector: 'app-user-invite-configuration-dialog',
  templateUrl: './user-invite-configuration-dialog.component.html',
  styleUrls: ['./user-invite-configuration-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppProgressBarComponent,
    DialogErrorComponent,
  ],
})
export class UserInviteConfigurationDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject<TailwindDialogRef<UserInviteConfigurationDialogComponent>>(
    'TailwindDialogRef' as any
  );
  private snackBar = inject(TailwindSnackBarService);
  private userInviteConfigureService = inject(UserInviteConfigureService);
  private data = inject<{ guid: string }>(MAT_DIALOG_DATA);

  // Local UI state — signal-native
  readonly showSecret = signal(false);
  readonly isBusy = signal(false);
  readonly hasErrored = signal(false);

  public endpointForm: FormGroup<UserInviteConfigForm>;
  // Status of the reactive form lifted to a signal so the template can react
  // declaratively (mirrors the toSignal-at-the-boundary pattern used by other
  // signal-native dialogs).
  readonly formStatus;
  readonly formValid;
  readonly canSubmit;

  constructor() {
    this.endpointForm = this.fb.group<UserInviteConfigForm>({
      clientID: this.fb.nonNullable.control('', Validators.required),
      clientSecret: this.fb.nonNullable.control('', Validators.required),
    });
    this.formStatus = toSignal(this.endpointForm.statusChanges, {
      initialValue: this.endpointForm.status,
    });
    this.formValid = computed(() => this.formStatus() === 'VALID');
    this.canSubmit = computed(() => this.formValid() && !this.isBusy());
  }

  toggleShowSecret(): void {
    this.showSecret.update(v => !v);
  }

  submit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.isBusy.set(true);
    this.hasErrored.set(false);
    this.userInviteConfigureService
      .configure(
        this.data.guid,
        this.endpointForm.value.clientID ?? '',
        this.endpointForm.value.clientSecret ?? ''
      )
      .pipe(take(1))
      .subscribe(v => {
        this.isBusy.set(false);
        if (v.error) {
          this.hasErrored.set(true);
          this.snackBar.error(v.errorMessage ?? 'Failed to configure User Invitation');
        } else {
          this.dialogRef.close();
        }
      });
  }
}

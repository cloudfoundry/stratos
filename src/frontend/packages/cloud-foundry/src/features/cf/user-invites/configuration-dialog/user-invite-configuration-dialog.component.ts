import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, type FormGroup, type FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

interface UserInviteConfigForm {
  clientID: FormControl<string>;
  clientSecret: FormControl<string>;
}
import { AppProgressBarComponent, TailwindSnackBarService, TailwindDialogRef, DialogErrorComponent, MAT_DIALOG_DATA } from '@stratosui/core';
import type { Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { UserInviteConfigureService } from '../user-invite.service';


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
    DialogErrorComponent
  ]
})
export class UserInviteConfigurationDialogComponent {
  connecting$!: Observable<boolean>;
  connectingError$!: Observable<boolean>;
  fetchingInfo$!: Observable<boolean>;
  endpointConnected$!: Observable<boolean>;
  valid$!: Observable<boolean>;
  canSubmit$!: Observable<boolean>;

  isBusy$!: Observable<boolean>;

  connectingSub!: Subscription;
  fetchSub!: Subscription;
  public endpointForm: FormGroup<UserInviteConfigForm>;

  // We need a delay to ensure the BE has finished registering the endpoint.
  // If we don't do this and if we're quick enough, we can navigate to the application page
  // and end up with an empty list where we should have results.
  public connectDelay = 1000;

  guid!: string;
  public showSecret = false;

  constructor(
    public fb: FormBuilder,
    public dialogRef: TailwindDialogRef<UserInviteConfigurationDialogComponent>,
    public snackBar: TailwindSnackBarService,
    public userInviteConfigureService: UserInviteConfigureService,
    @Inject(MAT_DIALOG_DATA) public data: {
      guid: string
    }
  ) {
    this.endpointForm = this.fb.group<UserInviteConfigForm>({
      clientID: this.fb.nonNullable.control('', Validators.required),
      clientSecret: this.fb.nonNullable.control('', Validators.required),
    });
  }

  submit() {
    this.userInviteConfigureService.configure(
      this.data.guid,
      this.endpointForm.value.clientID ?? '',
      this.endpointForm.value.clientSecret ?? '')
      .pipe(
        first()
      ).subscribe((v: { error?: boolean; errorMessage?: string }) => {
        if (v.error) {
          this.snackBar.open(v.errorMessage ?? 'Configuration error', 'Close');
        } else {
          this.dialogRef.close();
        }
      });
  }
}

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

interface UserInviteConfigForm {
  clientID: FormControl<string>;
  clientSecret: FormControl<string>;
}
import { AppProgressBarComponent } from '@stratosui/core';
import { TailwindSnackBarService } from '@stratosui/core';
import { TailwindDialogRef } from '@stratosui/core';
import { DialogErrorComponent } from '@stratosui/core';
import { MAT_DIALOG_DATA } from '@stratosui/core';
import { Observable, Subscription } from 'rxjs';
import { take,  } from 'rxjs/operators';

import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
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
  fb = inject(FormBuilder);
  dialogRef = inject<TailwindDialogRef<UserInviteConfigurationDialogComponent>>('TailwindDialogRef' as any);
  snackBar = inject(TailwindSnackBarService);
  userInviteConfigureService = inject(UserInviteConfigureService);
  data = inject<{
    guid: string;
}>(MAT_DIALOG_DATA);

  connecting$!: Observable<boolean>;
  connectingError$!: Observable<boolean>;
  fetchingInfo$!: Observable<boolean>;
  endpointConnected$!: Observable<boolean>;
  valid$!: Observable<boolean>;
  canSubmit$!: Observable<boolean>;


  private update$: Observable<ActionState>;

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

  constructor() {
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
        take(1)
      ).subscribe((v: any) => {
        if (v.error) {
          this.snackBar.open(v.errorMessage, 'Close');
        } else {
          this.dialogRef.close();
        }
      });
  }
}

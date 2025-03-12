import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { UserInviteConfigureService } from '../user-invite.service';


@Component({
  selector: 'app-user-invite-configuration-dialog',
  templateUrl: './user-invite-configuration-dialog.component.html',
  styleUrls: ['./user-invite-configuration-dialog.component.scss']
})
export class UserInviteConfigurationDialogComponent {
  connecting$: Observable<boolean>;
  connectingError$: Observable<boolean>;
  fetchingInfo$: Observable<boolean>;
  endpointConnected$: Observable<boolean>;
  valid$: Observable<boolean>;
  canSubmit$: Observable<boolean>;


  private update$: Observable<ActionState>;

  isBusy$: Observable<boolean>;

  connectingSub: Subscription;
  fetchSub: Subscription;
  public endpointForm: UntypedFormGroup;

  // We need a delay to ensure the BE has finished registering the endpoint.
  // If we don't do this and if we're quick enough, we can navigate to the application page
  // and end up with an empty list where we should have results.
  public connectDelay = 1000;

  guid: string;
  public showSecret = false;

  constructor(
    public fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<UserInviteConfigurationDialogComponent>,
    public snackBar: MatSnackBar,
    public userInviteConfigureService: UserInviteConfigureService,
    @Inject(MAT_DIALOG_DATA) public data: {
      guid: string
    }
  ) {
    this.endpointForm = this.fb.group({
      clientID: ['', Validators.required],
      clientSecret: ['', Validators.required],
    });
  }

  submit() {
    this.userInviteConfigureService.configure(
      this.data.guid,
      this.endpointForm.value.clientID,
      this.endpointForm.value.clientSecret)
      .pipe(
        first()
      ).subscribe((v: any) => {
        if (v.error) {
          this.snackBar.open(v.errorMessage, 'Close');
        } else {
          this.dialogRef.close();
        }
      });
  }
}

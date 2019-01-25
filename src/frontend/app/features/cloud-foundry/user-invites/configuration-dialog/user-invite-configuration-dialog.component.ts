import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { ActionState } from '../../../../store/reducers/api-request-reducer/types';
import { environment } from '../../../../../environments/environment';
import { UserInviteService } from '../user-invite.service';
import { tap } from 'rxjs/operators';

const { proxyAPIVersion, cfAPIVersion } = environment;


@Component({
  selector: 'app-user-invite-configurattion-dialog',
  templateUrl: './user-invite-configuration-dialog.component.html',
  styleUrls: ['./user-invite-configuration-dialog.component.scss']
})
export class UserInviteConfigurationDialogComponent implements OnDestroy {
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
  public endpointForm: FormGroup;

  // We need a delay to ensure the BE has finished registering the endpoint.
  // If we don't do this and if we're quick enough, we can navigate to the application page
  // and end up with an empty list where we should have results.
  public connectDelay = 1000;

  guid: string;

  constructor(
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<UserInviteConfigurationDialogComponent>,
    public snackBar: MatSnackBar,
    public userInviteService: UserInviteService,
    @Inject(MAT_DIALOG_DATA) public data: {
      guid: string
    }
  ) {
    this.endpointForm = this.fb.group({
      clientID: ['', Validators.required],
      clientSecret: ['', Validators.required],
    });

    // this.setupObservables();
    // this.setupSubscriptions();
  }

  submit() {
    this.userInviteService.configure(
      this.data.guid,
      this.endpointForm.value.clientID,
      this.endpointForm.value.clientSecret).pipe(
      tap(v => {
        console.log('****GOT VALUE');
        console.log(v);
      })
    ).subscribe((v: any) => {
      console.log(v);
      if (v.error) {
        this.snackBar.open(v.errorMessage);
      } else {
        this.dialogRef.close();
      }
    });
  }

  ngOnDestroy() {}
}

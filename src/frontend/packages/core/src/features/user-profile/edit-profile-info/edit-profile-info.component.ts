import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { first, map, take, tap } from 'rxjs/operators';

import { UserProfileInfo, UserProfileInfoUpdates } from '../../../../../store/src/types/user-profile.types';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';


@Component({
  selector: 'app-edit-profile-info',
  templateUrl: './edit-profile-info.component.html',
  styleUrls: ['./edit-profile-info.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditProfileInfoComponent implements OnInit, OnDestroy {

  editProfileForm: FormGroup;

  needsPasswordForEmailChange: boolean;

  constructor(
    private userProfileService: UserProfileService,
    private fb: FormBuilder,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    this.editProfileForm = this.fb.group({
      givenName: '',
      familyName: '',
      emailAddress: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    this.needsPasswordForEmailChange = false;
  }

  private sub: Subscription;

  private profile: UserProfileInfo;

  private lastRequired = false;
  private lastHavePassword = false;

  private emailAddress: string;


  // Only allow password change if user has the 'password.write' group
  public canChangePassword = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.PASSWORD_CHANGE);

  public passwordRequired = false;

  ngOnInit() {
    this.userProfileService.userProfile$.pipe(first()).subscribe(profile => {
      // UAA needs the user's password for email changes. Local user does not
      // Both need it for password change
      this.needsPasswordForEmailChange = (profile.origin === 'uaa');
      this.profile = profile;
      this.emailAddress = this.userProfileService.getPrimaryEmailAddress(profile);
      this.editProfileForm.setValue({
        givenName: profile.name.givenName,
        familyName: profile.name.familyName,
        emailAddress: this.userProfileService.getPrimaryEmailAddress(profile),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    });
    this.onChanges();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onChanges() {
    this.sub = this.editProfileForm.valueChanges.subscribe(values => {
      // Old password is required if either email or new pw is specified (uaa)
      // or only if new pw is specified (local account)
      const required = this.needsPasswordForEmailChange ?
        values.emailAddress !== this.emailAddress || values.newPassword.length : values.newPassword.length;
      this.passwordRequired = !!required;
      if (required !== this.lastRequired) {
        this.lastRequired = required;
        const validators = required ? [Validators.required] : [];
        this.editProfileForm.controls.currentPassword.setValidators(validators);
        this.editProfileForm.controls.currentPassword.updateValueAndValidity();
      }
      const havePassword = !!values.newPassword.length;
      if (havePassword !== this.lastHavePassword) {
        this.lastHavePassword = havePassword;
        const confirmValidator = havePassword ? [Validators.required, this.confirmPasswordValidator()] : [];
        this.editProfileForm.controls.confirmPassword.setValidators(confirmValidator);
        this.editProfileForm.controls.confirmPassword.updateValueAndValidity();
      }
    });
  }

  confirmPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const same = control.value === this.editProfileForm.value.newPassword;
      return same ? null : { passwordMatch: { value: control.value } };
    };
  }

  // Declared this way to ensure bound to this correctly
  updateProfile: StepOnNextFunction = () => {
    const updates: UserProfileInfoUpdates = {};
    // We will only send the values that were actually edited
    for (const key of Object.keys(this.editProfileForm.value)) {
      if (!this.editProfileForm.controls[key].pristine) {
        updates[key] = this.editProfileForm.value[key];
      }
    }
    const obs$ = this.userProfileService.updateProfile(this.profile, updates);
    return obs$.pipe(
      take(1),
      map(([profileResult, passwordResult]) => {
        const okay = !profileResult.error && !passwordResult.error;
        const message = `${profileResult.message || ''}${passwordResult.message || ''}`;
        return {
          success: okay,
          redirect: okay,
          message: okay ? '' : `An error occurred whilst updating your profile: ${message}`
        };
      }),
      tap(() => this.userProfileService.fetchUserProfile())
    );
  }
}

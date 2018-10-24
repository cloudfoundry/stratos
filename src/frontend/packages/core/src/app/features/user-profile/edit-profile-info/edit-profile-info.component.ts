import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher,
} from '@angular/material';
import { Subscription } from 'rxjs';
import { first, map, take } from 'rxjs/operators';

import { CurrentUserPermissions } from '../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../core/current-user-permissions.service';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { UserProfileInfo, UserProfileInfoUpdates } from '../../../store/types/user-profile.types';
import { UserProfileService } from '../user-profile.service';


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
  }

  private sub: Subscription;

  private profile: UserProfileInfo;

  private lastRequired = false;
  private lastHavePassword = false;

  private emailAddress: string;


  // Only allow password change if user has the 'password.write' group
  public canChangePassword = this.currentUserPermissionsService.can(CurrentUserPermissions.PASSWORD_CHANGE);

  public passwordRequired = false;

  ngOnInit() {
    this.userProfileService.fetchUserProfile();
    this.userProfileService.userProfile$.pipe(first()).subscribe(profile => {
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
      const required = values.emailAddress !== this.emailAddress || values.newPassword.length;
      this.passwordRequired = !!required;
      if (required !== this.lastRequired) {
        this.lastRequired = required;
        const validators = required ? [Validators.required] : [];
        this.editProfileForm.controls['currentPassword'].setValidators(validators);
        this.editProfileForm.controls['currentPassword'].updateValueAndValidity();
      }
      const havePassword = !!values.newPassword.length;
      if (havePassword !== this.lastHavePassword) {
        this.lastHavePassword = havePassword;
        const confirmValidator = havePassword ? [Validators.required, this.confirmPasswordValidator()] : [];
        this.editProfileForm.controls['confirmPassword'].setValidators(confirmValidator);
        this.editProfileForm.controls['confirmPassword'].updateValueAndValidity();
      }
    });
  }

  confirmPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const same = control.value === this.editProfileForm.value.newPassword;
      return same ? null : { 'passwordMatch': { value: control.value } };
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
      }), );
  }
}
